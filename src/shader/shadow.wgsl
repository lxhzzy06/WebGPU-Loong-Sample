struct VSOutput {
    @builtin(position) pos: vec4f,
    @location(0) fragPos: vec4f
}

@group(0) @binding(0) var<uniform> models: array<mat4x4<f32>, 3>;
@group(0) @binding(3) var<uniform> DirShadowMat: mat4x4<f32>;

@vertex
fn dir(@builtin(instance_index) Index: u32, @location(0) pos: vec3f) -> @builtin(position) vec4f {
    return DirShadowMat * models[Index] * vec4f(pos, 1.0);
}