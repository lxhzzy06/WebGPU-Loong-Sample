const positionOffset = 0;
const normalOffset = 3 * 4;
const stride = 6 * 4;

export const VertexBuffers: Iterable<GPUVertexBufferLayout> = [
	{
		arrayStride: stride,
		attributes: [
			{
				// position
				shaderLocation: 0,
				offset: positionOffset,
				format: 'float32x3'
			},
			{
				shaderLocation: 1,
				offset: normalOffset,
				format: 'float32x3'
			}
		]
	}
];
