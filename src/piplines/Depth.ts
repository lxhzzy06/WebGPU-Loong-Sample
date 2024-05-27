import { StructuredView, makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import code from '../shader/depth.wgsl?raw';
import { device, canvas, PreferredFormat } from '../init';
import { ShadowDepthTextureView } from './Shadow';

export default class DepthRender {
	Desc: GPURenderPassDescriptor;
	Bundle: GPURenderBundle;
	WHB: GPUBuffer;
	WHValues: StructuredView;

	constructor() {
		const ShaderModule = device.createShaderModule({ code: code });
		const defs = makeShaderDataDefinitions(code);
		this.WHValues = makeStructuredView(defs.uniforms.WH);
		this.WHB = device.createBuffer({
			size: this.WHValues.arrayBuffer.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
			label: 'Depth WH Buffer'
		});
		this.Update(canvas.width, canvas.height);
		this.Desc = {
			colorAttachments: [{ loadOp: 'clear', storeOp: 'store', view: undefined! }]
		};

		const DpethPipeline = device.createRenderPipeline({
			vertex: {
				module: ShaderModule,
				entryPoint: 'vs'
			},
			fragment: {
				module: ShaderModule,
				entryPoint: 'fs',
				targets: [
					{
						format: PreferredFormat
					}
				]
			},
			primitive: {
				topology: 'triangle-list'
			},
			layout: 'auto'
		});

		const DepthGroup = device.createBindGroup({
			label: 'Depth BindGroup',
			layout: DpethPipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: ShadowDepthTextureView },
				{ binding: 1, resource: device.createSampler({}) },
				{ binding: 2, resource: { buffer: this.WHB } }
			]
		});

		const Encoder = device.createRenderBundleEncoder({
			colorFormats: [PreferredFormat]
		});
		Encoder.setPipeline(DpethPipeline);
		Encoder.setBindGroup(0, DepthGroup);
		Encoder.draw(6);
		this.Bundle = Encoder.finish();
	}

	public Update(Width: number, Height: number) {
		this.WHValues.set({ Width, Height });
		device.queue.writeBuffer(this.WHB, 0, this.WHValues.arrayBuffer);
	}

	public Render(commandEncoder: GPUCommandEncoder, View: GPUTextureView) {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].view = View;
		const pass = commandEncoder.beginRenderPass(this.Desc);
		pass.executeBundles([this.Bundle]);
		pass.end();
	}
}
