@group(0) @binding(0) var<uniform> PorjViewMatrix: mat4x4<f32>;
@group(0) @binding(1) var Sampler: sampler;
@group(0) @binding(2) var Texture: texture_cube<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4f,
  @location(0) fragPosition: vec3f,
}

@vertex
fn vs(
    @location(0) position: vec3f
) -> VertexOutput {
    var output: VertexOutput;
    output.Position = (PorjViewMatrix * vec4f(position, 1.0)).xyww;
    output.fragPosition = position;
    return output;
}

@fragment
fn fs(
    @location(0) fragPosition: vec3f
) -> @location(0) vec4f {
    return textureSample(Texture, Sampler, fragPosition);
}