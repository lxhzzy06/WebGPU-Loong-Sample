const shadowDepthTextureSize = 2048.0;

struct TLight {
    objectColor: vec3f,
     ambinColor: vec3f,
    pointLightColor: vec3f,
    ambinStrength: f32,
    specularStrength: f32,
    specularConstant: f32,
    specularLinear: f32,
    specularQuadratic: f32,
    reflectSkyboxStrength: f32,
}

struct TMatrix {
    view: mat4x4<f32>,
    proj: mat4x4<f32>,
    normal: mat3x3<f32>,
    LightModelMatrix: mat4x4<f32>,
    cameraPos: vec4f,
    LightPos: vec4f,
}

struct VSO {
    @builtin(position) pos: vec4f,
    @location(0) normal: vec3f,
    @location(1) FragPos: vec4f,
    @location(2) shadowPos: vec3f,
}

fn DirShadow(shadowPos: vec3f) -> f32 {
    return textureSampleCompare(DirShadowMap, DirShadowSampler, shadowPos.xy, shadowPos.z - 0.005);
}

@group(0) @binding(0) var<uniform> models: array<mat4x4<f32>, 3>;
@group(0) @binding(1) var<uniform> Matrix: TMatrix;
@group(0) @binding(2) var<uniform> Light: TLight;
@group(0) @binding(3) var<uniform> DirShadowMat: mat4x4<f32>;
@group(0) @binding(4) var DirShadowMap: texture_depth_2d;
@group(0) @binding(5) var DirShadowSampler: sampler_comparison;
@group(0) @binding(6) var SkyboxSampler: sampler;
@group(0) @binding(7) var SkyboxTexture: texture_cube<f32>;


@vertex
fn vs(@builtin(instance_index) Index: u32, @location(0) pos: vec3f, @location(1) normal: vec3f) -> VSO {
    var out: VSO;
    out.FragPos = models[Index] * vec4f(pos, 1.0);
    out.pos = Matrix.proj * Matrix.view * out.FragPos;
    if Index == 2u {
        out.normal = normalize(Matrix.normal * normal);
    } else {
        out.normal = normal;
    }
    let posFromLight = DirShadowMat * out.FragPos;
    out.shadowPos = vec3f(posFromLight.xy * vec2f(0.5, -0.5) + vec2f(0.5), posFromLight.z);
    return out;
}

@fragment
fn fs(input: VSO) -> @location(0) vec4f {
    let LightPos = Matrix.LightPos;
    let ambint = Light.ambinColor * Light.ambinStrength;
    let lightDir = normalize(LightPos - input.FragPos).xyz;
    let diffuse = max(dot(input.normal, lightDir), 0.0) * Light.pointLightColor;
    let viewDir = normalize(Matrix.cameraPos - input.FragPos).xyz;
    let halfwayDir = normalize(lightDir + viewDir);
    let specular = Light.specularStrength * pow(max(dot(input.normal, halfwayDir), 0.0), 64.0) * Light.pointLightColor;
    let distance = length(LightPos - input.FragPos);
    let attenuation = 1.0 / (Light.specularConstant + Light.specularLinear * distance + Light.specularQuadratic * (distance * distance));
    let R = textureSample(SkyboxTexture, SkyboxSampler, reflect(-viewDir, input.normal)).rgb;
    return vec4f(((R * Light.reflectSkyboxStrength) + (1.0 - Light.reflectSkyboxStrength) * (ambint + DirShadow(input.shadowPos) * (diffuse + specular) * attenuation) * Light.objectColor), 1.0);
}


@vertex
fn vs_light(@location(0) pos: vec3f) -> @builtin(position) vec4f {
    return Matrix.proj * Matrix.view * Matrix.LightModelMatrix * vec4f(pos, 1.0);
}

@fragment
fn fs_light() -> @location(0) vec4f {
    return vec4f(vec3f(Light.pointLightColor), 1.0);
}
