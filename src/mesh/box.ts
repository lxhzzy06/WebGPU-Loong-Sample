// prettier-ignore
const BoxVertex = new Float32Array([
    // float3 position, float3 normal
    0.5,0.5,0.5,    1,0,0,
    0.5,0.5,-0.5,   1,0,0,
    0.5,-0.5,0.5,   1,0,0,
    0.5,-0.5,-0.5,  1,0,0,
    -0.5,0.5,-0.5,  -1,0,0,
    -0.5,0.5,0.5,   -1,0,0,
    -0.5,-0.5,-0.5, -1,0,0,
    -0.5,-0.5,0.5,  -1,0,0,
    -0.5,0.5,-0.5,  0,1,0,
    0.5,0.5,-0.5,   0,1,0,
    -0.5,0.5,0.5,   0,1,0,
    0.5,0.5,0.5,    0,1,0,
    -0.5,-0.5,0.5,  0,-1,0,
    0.5,-0.5,0.5,   0,-1,0,
    -0.5,-0.5,-0.5, 0,-1,0,
    0.5,-0.5,-0.5,  0,-1,0,
    -0.5,0.5,0.5,   0,0,1,
    0.5,0.5,0.5,    0,0,1,
    -0.5,-0.5,0.5,  0,0,1,
    0.5,-0.5,0.5,   0,0,1,
    0.5,0.5,-0.5,   0,0,-1,
    -0.5,0.5,-0.5,  0,0,-1,
    0.5,-0.5,-0.5,  0,0,-1,
    -0.5,-0.5,-0.5, 0,0,-1
])

// prettier-ignore
const BoxIndex = new Uint16Array([
    0,2,1,
    2,3,1,
    4,6,5,
    6,7,5,
    8,10,9,
    10,11,9,
    12,14,13,
    14,15,13,
    16,18,17,
    18,19,17,
    20,22,21,
    22,23,21
])
const BoxVertexCount = 24;
const BoxIndexCount = 36;
export { BoxVertex, BoxIndex, BoxVertexCount, BoxIndexCount };
