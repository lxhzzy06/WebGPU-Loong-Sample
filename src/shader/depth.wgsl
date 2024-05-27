struct TWH {
    Width: f32,
    Height: f32
}

@group(0) @binding(0) var shadowMap: texture_depth_2d;
@group(0) @binding(1) var shadowSampler: sampler;
@group(0) @binding(2) var<uniform> WH: TWH;

fn LinearizeDepth(depth: f32) -> f32 {
    let z = depth * 2.0 - 1.0; // Back to NDC 
    let near_plane = 0.001;
    let far_plane = 0.4;
    return (2.0 * near_plane * far_plane) / (far_plane + near_plane - z * (far_plane - near_plane));
}

@vertex
fn vs(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
    var arr = array<vec2f, 6>(
        vec2f(-1.0, -1.0),
        vec2f(-1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(-1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(1.0, 1.0)
    );
    return vec4f(arr[index], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let z = textureSample(shadowMap, shadowSampler, pos.xy / vec2f(WH.Width, WH.Height));
    return vec4f(vec3f(z), 1.0);
}