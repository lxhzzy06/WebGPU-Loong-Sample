import { BoxIndexBuffer, BoxVerticesBuffer, LoongIndexBuffer, LoongIndexCount, LoongVertexBuffer, device } from '../init';
import { BoxIndexCount } from '../mesh/box';
import { VertexBuffers } from '../mesh/offset';
import code from '../shader/shadow.wgsl?raw';

export const DirShadowBuffer = device.createBuffer({
	size: 64,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

export const ShadowDepthTexture = device.createTexture({
	label: 'ShadowDepthTexture',
	size: [2048, 2048],
	format: 'depth32float',
	usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
});

export const ShadowDepthTextureView = ShadowDepthTexture.createView();

export class ShadowRender {
	Desc: GPURenderPassDescriptor;
	Bundle: GPURenderBundle;

	constructor(entries: Iterable<GPUBindGroupEntry>) {
		const ShaderModule = device.createShaderModule({ code: code });
		this.Desc = {
			colorAttachments: [],
			depthStencilAttachment: {
				view: ShadowDepthTextureView,
				depthClearValue: 1.0,
				depthLoadOp: 'clear',
				depthStoreOp: 'store'
			}
		};

		const Pipeline = device.createRenderPipeline({
			vertex: {
				module: ShaderModule,
				entryPoint: 'dir',
				buffers: VertexBuffers
			},
			primitive: {
				topology: 'triangle-list',
				cullMode: 'back'
			},
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: 'less',
				format: 'depth32float'
			},
			layout: 'auto'
		});

		const BindGroup = device.createBindGroup({
			label: 'Shadow BindGroup',
			layout: Pipeline.getBindGroupLayout(0),
			entries
		});

		const Encoder = device.createRenderBundleEncoder({
			colorFormats: [],
			depthStencilFormat: 'depth32float'
		});
		Encoder.setPipeline(Pipeline);
		Encoder.setBindGroup(0, BindGroup);
		Encoder.setVertexBuffer(0, BoxVerticesBuffer);
		Encoder.setIndexBuffer(BoxIndexBuffer, 'uint16');
		Encoder.drawIndexed(BoxIndexCount, 2);
		Encoder.setVertexBuffer(0, LoongVertexBuffer);
		Encoder.setIndexBuffer(LoongIndexBuffer, 'uint16');
		Encoder.drawIndexed(LoongIndexCount, 1, 0, 0, 2);
		this.Bundle = Encoder.finish();
	}

	public Render(commandEncoder: GPUCommandEncoder) {
		const pass = commandEncoder.beginRenderPass(this.Desc);
		pass.executeBundles([this.Bundle]);
		pass.end();
	}
}
