import { createTextureFromImages } from 'webgpu-utils';
import { CubeVertex } from '../mesh/cube';
import { CubeVerticesBuffer, PreferredFormat, device } from '../init';
import code from '../shader/skybox.wgsl?raw';
import { Mat4 } from 'wgpu-matrix';
const ShaderModule = device.createShaderModule({ code });

import cloud_back from '/cloud/back.png';
import cloud_down from '/cloud/down.png';
import cloud_front from '/cloud/front.png';
import cloud_left from '/cloud/left.png';
import cloud_up from '/cloud/up.png';
import cloud_right from '/cloud/right.png';
const CloudTexture = await createTextureFromImages(device, [cloud_right, cloud_left, cloud_up, cloud_down, cloud_front, cloud_back]);
export const CloudTextureView = CloudTexture.createView({ dimension: 'cube' });

import garden_back from '/garden/back.png';
import garden_down from '/garden/down.png';
import garden_front from '/garden/front.png';
import garden_left from '/garden/left.png';
import garden_up from '/garden/up.png';
import garden_right from '/garden/right.png';
const GardenTexture = await createTextureFromImages(device, [garden_right, garden_left, garden_up, garden_down, garden_front, garden_back]);
export const GardenTextureView = GardenTexture.createView({ dimension: 'cube' });

export const SkyboxSampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
const SkyboxMatrixBuffer = device.createBuffer({
	size: 64,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	label: 'Skybox BindGroup Buffer'
});

export default class SkyboxRender {
	Desc: GPURenderPassDescriptor;
	CloudBundle: GPURenderBundle;
	GardenBundle: GPURenderBundle;

	constructor(depthTextureView: GPUTextureView, MultiSampleTextureView: GPUTextureView) {
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
				entryPoint: 'vs',
				buffers: [{ arrayStride: 12, stepMode: 'vertex', attributes: [{ format: 'float32x3', offset: 0, shaderLocation: 0 }] }]
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
				depthCompare: 'less-equal',
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
		CloudEncoder.setVertexBuffer(0, CubeVerticesBuffer);
		CloudEncoder.setBindGroup(
			0,
			device.createBindGroup({
				label: 'Cloud BindGroup',
				layout: Pipeline.getBindGroupLayout(0),
				entries: [
					{ binding: 0, resource: { buffer: SkyboxMatrixBuffer } },
					{ binding: 1, resource: SkyboxSampler },
					{ binding: 2, resource: CloudTextureView }
				]
			})
		);
		CloudEncoder.draw(CubeVertex.length / 3);
		this.CloudBundle = CloudEncoder.finish();

		const GardenEncoder = device.createRenderBundleEncoder({
			colorFormats: [PreferredFormat],
			depthStencilFormat: 'depth32float',
			sampleCount: 4
		});

		GardenEncoder.setPipeline(Pipeline);
		GardenEncoder.setVertexBuffer(0, CubeVerticesBuffer);
		GardenEncoder.setBindGroup(
			0,
			device.createBindGroup({
				label: 'Garden BindGroup',
				layout: Pipeline.getBindGroupLayout(0),
				entries: [
					{ binding: 0, resource: { buffer: SkyboxMatrixBuffer } },
					{ binding: 1, resource: SkyboxSampler },
					{ binding: 2, resource: GardenTextureView }
				]
			})
		);
		GardenEncoder.draw(CubeVertex.length / 3);
		this.GardenBundle = GardenEncoder.finish();
	}

	public Update(depthTextureView: GPUTextureView, MultiSampleTextureView: GPUTextureView) {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].view = MultiSampleTextureView;
		this.Desc.depthStencilAttachment!.view = depthTextureView;
	}

	public UpdateMatrix(mat: Mat4) {
		device.queue.writeBuffer(SkyboxMatrixBuffer, 0, mat as Float32Array);
	}

	Render(commandEncoder: GPUCommandEncoder, View: GPUTextureView, Garden: boolean): void {
		(this.Desc.colorAttachments as GPURenderPassColorAttachment[])[0].resolveTarget = View;
		const pass = commandEncoder.beginRenderPass(this.Desc);
		pass.executeBundles([Garden ? this.GardenBundle : this.CloudBundle]);
		pass.end();
	}
}
