import { BoxIndex, BoxVertex } from './mesh/box';
import { CubeVertex } from './mesh/cube';
import { SphareIndex, SphareVertex } from './mesh/sphere';
import { mesh } from './mesh/stanfordDragon';
import { CreateVertexAndIndexBuffers } from './utils/utils';

export const device = await (await navigator.gpu.requestAdapter())!.requestDevice();
device.lost.then(() => console.log('GPU device lost'));
export const canvas = document.querySelector('#render')! as HTMLCanvasElement;
export const devicePixelRatio = window.devicePixelRatio;
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
export const context = canvas.getContext('webgpu')!;
export const PreferredFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
	device,
	format: PreferredFormat,
	alphaMode: 'premultiplied'
});

export const { VerticesBuffer: BoxVerticesBuffer, IndexBuffer: BoxIndexBuffer } = CreateVertexAndIndexBuffers(BoxVertex, BoxIndex);
export const { VerticesBuffer: SphareVerticesBuffer, IndexBuffer: SphareIndexBuffer } = CreateVertexAndIndexBuffers(SphareVertex, SphareIndex);
export const CubeVerticesBuffer = device.createBuffer({
	size: CubeVertex.byteLength,
	usage: GPUBufferUsage.VERTEX,
	mappedAtCreation: true
});
new Float32Array(CubeVerticesBuffer.getMappedRange()).set(CubeVertex);
CubeVerticesBuffer.unmap();

// Create the model vertex buffer.
export const LoongVertexBuffer = device.createBuffer({
	size: mesh.positions.length * 3 * 2 * 4,
	usage: GPUBufferUsage.VERTEX,
	mappedAtCreation: true
});
{
	const mapping = new Float32Array(LoongVertexBuffer.getMappedRange());
	for (let i = 0; i < mesh.positions.length; ++i) {
		mapping.set(mesh.positions[i], 6 * i);
		mapping.set(mesh.normals[i], 6 * i + 3);
	}
	LoongVertexBuffer.unmap();
}

// Create the model index buffer.
export const LoongIndexCount = mesh.triangles.length * 3;
export const LoongIndexBuffer = device.createBuffer({
	size: LoongIndexCount * Uint16Array.BYTES_PER_ELEMENT,
	usage: GPUBufferUsage.INDEX,
	mappedAtCreation: true
});
{
	const mapping = new Uint16Array(LoongIndexBuffer.getMappedRange());
	for (let i = 0; i < mesh.triangles.length; ++i) {
		mapping.set(mesh.triangles[i], 3 * i);
	}
	LoongIndexBuffer.unmap();
}
