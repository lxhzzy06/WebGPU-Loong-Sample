import { mat3, mat4, vec3, vec4 } from 'wgpu-matrix';
import { makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import { createInputHandler } from './utils/input';
import code from './shader/render.wgsl?raw';
import { WASDCamera } from './utils/camera';
import { SetUpGUI, SetUpStats, Settings, joystick } from './utils/utils';
import DepthRender from './piplines/Depth';
import { PreferredFormat, canvas, context, device } from './init';
import { ShadowRender, ShadowDepthTextureView, DirShadowBuffer } from './piplines/Shadow';
import { LightRender, RenderRender } from './piplines/Render';
import SkyboxRender, { SkyboxSampler } from './piplines/Skybox';

const inputHandler = createInputHandler(canvas, joystick);
const camera = new WASDCamera({ position: vec3.create(0, 0, 20) });
const DirShadowProj = mat4.ortho(-100, 100, -100, 100, -100, 100);
const ToFloat = (v: number) => v / 255;
let ProjMatrix = mat4.perspective(Math.PI / 2, canvas.width / canvas.height, 1, 200);
camera.pitch = 0;
camera.yaw = 0;
const stats = SetUpStats();
SetUpGUI();

const defs = makeShaderDataDefinitions(code);
const MatrixValues = makeStructuredView(defs.uniforms.Matrix);
const ModelsValues = makeStructuredView(defs.uniforms.models);
const LightValues = makeStructuredView(defs.uniforms.Light);

let depthTexture = device.createTexture({
	label: 'DepthTexture',
	size: [canvas.width, canvas.height],
	format: 'depth32float',
	sampleCount: 4,
	usage: GPUTextureUsage.RENDER_ATTACHMENT
});

let depthTextureView = depthTexture.createView();

let MultiSampleTexture = device.createTexture({
	label: 'MultiSampleTexture',
	size: [canvas.width, canvas.height],
	sampleCount: 4,
	format: PreferredFormat,
	usage: GPUTextureUsage.RENDER_ATTACHMENT
});

let MultiSampleTextureView = MultiSampleTexture.createView();

const MatrixBuffer = device.createBuffer({
	size: MatrixValues.arrayBuffer.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const LightBuffer = device.createBuffer({
	size: LightValues.arrayBuffer.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const ModelsBuffer = device.createBuffer({
	size: ModelsValues.arrayBuffer.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const ModelsBinding: GPUBindGroupEntry = { binding: 0, resource: { buffer: ModelsBuffer } };
const MatrixBinding: GPUBindGroupEntry = { binding: 1, resource: { buffer: MatrixBuffer } };
const LightBinding: GPUBindGroupEntry = { binding: 2, resource: { buffer: LightBuffer } };
const DirShadowBinding: GPUBindGroupEntry = { binding: 3, resource: { buffer: DirShadowBuffer } };
const Depth = new DepthRender();
const Shadow = new ShadowRender([ModelsBinding, DirShadowBinding]);
const Render = new RenderRender(
	[
		ModelsBinding,
		MatrixBinding,
		LightBinding,
		DirShadowBinding,
		{ binding: 4, resource: ShadowDepthTextureView },
		{ binding: 5, resource: device.createSampler({ compare: 'less' }) },
		{ binding: 6, resource: SkyboxSampler }
	],
	depthTextureView,
	MultiSampleTextureView
);
const Light = new LightRender([MatrixBinding, LightBinding], depthTextureView, MultiSampleTextureView);
const Skybox = new SkyboxRender(depthTextureView, MultiSampleTextureView);

const observer = new ResizeObserver(() => {
	const width = document.documentElement.clientWidth * devicePixelRatio;
	const height = document.documentElement.clientHeight * devicePixelRatio;
	canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
	canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
	depthTexture.destroy();
	depthTexture = device.createTexture({
		label: 'DepthTexture',
		size: [canvas.width, canvas.height],
		format: 'depth32float',
		sampleCount: 4,
		usage: GPUTextureUsage.RENDER_ATTACHMENT
	});

	depthTextureView = depthTexture.createView();

	MultiSampleTexture.destroy();
	MultiSampleTexture = device.createTexture({
		label: 'MultiSampleTexture',
		size: [canvas.width, canvas.height],
		sampleCount: 4,
		format: PreferredFormat,
		usage: GPUTextureUsage.RENDER_ATTACHMENT
	});

	MultiSampleTextureView = MultiSampleTexture.createView();
	Render.Update(depthTextureView, MultiSampleTextureView);
	Light.Update(depthTextureView, MultiSampleTextureView);
	Skybox.Update(depthTextureView, MultiSampleTextureView);
	Depth.Update(canvas.width, canvas.height);
	ProjMatrix = mat4.perspective(Math.PI / 2, canvas.width / canvas.height, 1, 100);
});
observer.observe(canvas);

const FloorModelMat = mat4.scaling(vec3.fromValues(50, 1, 50));
const BoxModelMatrix = mat4.scaling(vec3.create(8, 8, 8));
mat4.translate(FloorModelMat, vec3.fromValues(0, -5, 0), FloorModelMat);
function UpdateMatrix(now: number, deltaTime: number) {
	const LightPos = vec4.create();
	const ViewMatrix = camera.update(deltaTime, inputHandler());
	const LoongModelMat = mat4.translation(vec3.create(0, 1.5, 0));
	mat4.scale(LoongModelMat, vec3.create(0.1, 0.1, 0.1), LoongModelMat);
	if (Settings.Loong.Rotate) mat4.rotateY(LoongModelMat, Math.sin(now / 1000) * Math.PI, LoongModelMat);

	const LightModelMatrix = mat4.scaling(vec3.create(1.5, 1.5, 1.5));
	if (Settings.Light.Rotate) mat4.rotateY(LightModelMatrix, Math.sin(now / 1000) * Math.PI, LightModelMatrix);
	mat4.translate(LightModelMatrix, vec3.fromValues(Settings.Light.X, Settings.Light.Y, Settings.Light.Z), LightModelMatrix);
	vec3.transformMat4(LightPos, LightModelMatrix, LightPos);

	ModelsValues.set([BoxModelMatrix, FloorModelMat, LoongModelMat]);

	device.queue.writeBuffer(DirShadowBuffer, 0, mat4.mul(DirShadowProj, mat4.lookAt(LightPos, vec3.create(), vec3.create(0, 1, 0))) as Float32Array);
	device.queue.writeBuffer(ModelsBuffer, 0, ModelsValues.arrayBuffer);

	MatrixValues.set({
		proj: ProjMatrix,
		view: ViewMatrix,
		normal: mat3.transpose(mat3.inverse(mat3.fromMat4(LoongModelMat))),
		cameraPos: camera.position,
		LightModelMatrix,
		LightPos
	});

	LightValues.set({
		objectColor: Settings.Color.objectColor.map(ToFloat),
		ambinColor: Settings.Color.ambinColor.map(ToFloat),
		pointLightColor: Settings.Light.LightColor.map(ToFloat),
		ambinStrength: Settings.Color.ambinStrength,
		specularStrength: Settings.Color.specularStrength,
		specularConstant: Settings.Color.specularConstant,
		specularLinear: Settings.Color.specularLinear,
		specularQuadratic: Settings.Color.specularQuadratic,
		reflectSkyboxStrength: Settings.reflectSkyboxStrength
	});

	const SkyboxView = mat4.copy(ViewMatrix);
	SkyboxView[12] = 0;
	SkyboxView[13] = 0;
	SkyboxView[14] = 0;
	mat4.mul(SkyboxView, mat4.scaling(vec3.fromValues(10, 10, 10)), SkyboxView);
	Skybox.UpdateMatrix(mat4.mul(ProjMatrix, SkyboxView));

	device.queue.writeBuffer(LightBuffer, 0, LightValues.arrayBuffer);
	device.queue.writeBuffer(MatrixBuffer, 0, MatrixValues.arrayBuffer);
}

let lastFrameMS = Date.now();
function frame() {
	stats.begin();
	const now = Date.now();
	const deltaTime = (now - lastFrameMS) / 1000;
	lastFrameMS = now;
	UpdateMatrix(now, deltaTime);

	const TextureView = context.getCurrentTexture().createView({ label: 'TextureView' });
	const commandEncoder = device.createCommandEncoder();
	Shadow.Render(commandEncoder);
	if (Settings.DepthTexture) {
		Depth.Render(commandEncoder, TextureView);
	} else {
		Render.Render(commandEncoder, TextureView, Settings.Skybox === 'Garden');
		Light.Render(commandEncoder, TextureView);
		Skybox.Render(commandEncoder, TextureView, Settings.Skybox === 'Garden');
	}
	device.queue.submit([commandEncoder.finish()]);
	stats.end();
	requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
