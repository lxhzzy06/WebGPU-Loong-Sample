import {
	BoxIndexBuffer,
	BoxVerticesBuffer,
	LoongIndexBuffer,
	LoongIndexCount,
	LoongVertexBuffer,
	PreferredFormat,
	SphareIndexBuffer,
	SphareVerticesBuffer,
	device
} from '../init';
import { BoxIndexCount } from '../mesh/box';
import { VertexBuffers } from '../mesh/offset';
import { SphareIndexCount } from '../mesh/sphere';
import code from '../shader/render.wgsl?raw';
import { CloudTextureView, GardenTextureView } from './Skybox';
const ShaderModule = device.createShaderModule({ code: code });

export class RenderRender {
	Desc: GPURenderPassDescriptor;
	CloudBundle: GPURenderBundle;
	GardenBundle: GPURenderBundle;

	constructor(entries: GPUBindGroupEntry[], depthTextureView: GPUTextureView, MultiSampleTextureView: GPUTextureView) {
		this.Desc = {
			colorAttachments: [
				{
					clearValue: [0.0, 0.0, 0.0, 1.0],
					loadOp: 'clear',
					storeOp: 'store',
					view: MultiSampleTextureView
				}
			],
			depthStencilAttachment: {
				view: depthTextureView,
				depthClearValue: 1.0,
				depthLoadOp: 'clear',
				depthStoreOp: 'store'
			}
		};

		const Pipeline = device.createRenderPipeline({
			vertex: {
				module: ShaderModule,
				entryPoint: 'vs',
				buffers: VertexBuffers
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
				topology: 'triangle-list',
				cullMode: 'back'
			},
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: 'less',
				format: 'depth32float'
			},
			multisample: {
				count: 4
			},
			layout: 'auto'
		});

		const CloudEncoder = device.createRenderBundleEncoder({
			colorFormats: [PreferredFormat],
			depthStencilFormat: 'depth32float',
			sampleCount: 4
		});
		CloudEncoder.setPipeline(Pipeline);
		CloudEncoder.setBindGroup(
			0,
			device.createBindGroup({
				label: 'Render Cloud BindGroup',
				layout: Pipeline.getBindGroupLayout(0),
				entries: entries.concat({ binding: 7, resource: CloudTextureView })
			})
		);
		CloudEncoder.setVertexBuffer(0, BoxVerticesBuffer);
		CloudEncoder.setIndexBuffer(BoxIndexBuffer, 'uint16');
		CloudEncoder.drawIndexed(BoxIndexCount, 2);
		CloudEncoder.setVertexBuffer(0, LoongVertexBuffer);
		CloudEncoder.setIndexBuffer(LoongIndexBuffer, 'uint16');
		CloudEncoder.drawIndexed(LoongIndexCount, 1, 0, 0, 2);
		this.CloudBundle = CloudEncoder.finish();

		const GardenEncoder = device.createRenderBundleEncoder({
			colorFormats: [PreferredFormat],
			depthStencilFormat: 'depth32float',
			sampleCount: 4
		});
		GardenEncoder.setPipeline(Pipeline);
		GardenEncoder.setBindGroup(
			0,
			device.createBindGroup({
				label: 'Render Cloud BindGroup',
				layout: Pipeline.getBindGroupLayout(0),
				entries: entries.concat({ binding: 7, resource: GardenTextureView })
			})
		);
		GardenEncoder.setVertexBuffer(0, BoxVerticesBuffer);
		GardenEncoder.setIndexBuffer(BoxIndexBuffer, 'uint16');
		GardenEncoder.drawIndexed(BoxIndexCount, 2);
		GardenEncoder.setVertexBuffer(0, LoongVertexBuffer);
		GardenEncoder.setIndexBuffer(LoongIndexBuffer, 'uint16');
		GardenEncoder.drawIndexed(LoongIndexCount, 1, 0, 0, 2);
		this.GardenBundle = GardenEncoder.finish();
	}

	public Update(depthTextureView: GPUTextureView, MultiSampleTextureView: GPUTextureView) {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].view = MultiSampleTextureView;
		this.Desc.depthStencilAttachment!.view = depthTextureView;
	}

	public Render(commandEncoder: GPUCommandEncoder, View: GPUTextureView, Garden: boolean) {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].resolveTarget = View;
		const pass = commandEncoder.beginRenderPass(this.Desc);
		pass.executeBundles([Garden ? this.GardenBundle : this.CloudBundle]);
		pass.end();
	}
}

export class LightRender {
	Desc: GPURenderPassDescriptor;
	Bundle: GPURenderBundle;

	constructor(entries: Iterable<GPUBindGroupEntry>, depthTextureView: GPUTextureView, MultiSampleTextureView: GPUTextureView) {
		this.Desc = {
			colorAttachments: [{ loadOp: 'load', storeOp: 'store', view: MultiSampleTextureView }],
			depthStencilAttachment: {
				view: depthTextureView,
				depthClearValue: 1.0,
				depthLoadOp: 'load',
				depthStoreOp: 'store'
			}
		};

		const Pipeline = device.createRenderPipeline({
			vertex: {
				module: ShaderModule,
				entryPoint: 'vs_light',
				buffers: VertexBuffers
			},
			fragment: {
				module: ShaderModule,
				entryPoint: 'fs_light',
				targets: [
					{
						format: PreferredFormat
					}
				]
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
			multisample: {
				count: 4
			},
			layout: device.createPipelineLayout({
				label: 'Light Pipeline Layout',
				bindGroupLayouts: [
					device.createBindGroupLayout({
						label: 'Light BindGroupLayout',
						entries: [
							{
								binding: 1,
								visibility: GPUShaderStage.VERTEX,
								buffer: { type: 'uniform' }
							},
							{ binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }
						]
					})
				]
			})
		});

		const BindGroup = device.createBindGroup({
			label: 'Light BindGroup',
			layout: Pipeline.getBindGroupLayout(0),
			entries
		});

		const Encoder = device.createRenderBundleEncoder({
			colorFormats: [PreferredFormat],
			depthStencilFormat: 'depth32float',
			sampleCount: 4
		});

		Encoder.setPipeline(Pipeline);
		Encoder.setVertexBuffer(0, SphareVerticesBuffer);
		Encoder.setIndexBuffer(SphareIndexBuffer, 'uint16');
		Encoder.setBindGroup(0, BindGroup);
		Encoder.drawIndexed(SphareIndexCount);
		this.Bundle = Encoder.finish();
	}

	public Update(depthTextureView: GPUTextureView, MultiSampleTextureView: GPUTextureView) {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].view = MultiSampleTextureView;
		this.Desc.depthStencilAttachment!.view = depthTextureView;
	}

	Render(commandEncoder: GPUCommandEncoder, View: GPUTextureView): void {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].resolveTarget = View;
		const pass = commandEncoder.beginRenderPass(this.Desc);
		pass.executeBundles([this.Bundle]);
		pass.end();
	}
}
