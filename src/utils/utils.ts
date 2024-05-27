import { GUI } from 'dat.gui';
import nipple from 'nipplejs';
import Stats from 'stats.js';
import { device } from '../init';

export const app = document.querySelector('#app')!;
export const Settings = {
	Light: {
		X: 10.0,
		Y: 8.0,
		Z: 0.0,
		LightColor: [255, 255, 255],
		Rotate: false
	},
	Color: {
		objectColor: [70, 100, 170],
		ambinColor: [255, 255, 255],
		ambinStrength: 0.1,
		specularStrength: 0.5,
		specularConstant: 1.0,
		specularLinear: 0.01,
		specularQuadratic: 0.001
	},
	Loong: { Rotate: false },
	reflectSkyboxStrength: 0.35,
	Skybox: 'Cloud',
	DepthTexture: false,
	FullScreen: false
};
type ISettings = typeof Settings;
export const joystick = nipple.create({
	zone: document.querySelector('#joystick')! as HTMLElement,
	size: 100,
	mode: 'static',
	color: 'blue',
	position: { left: '20%', top: '80%' }
});

export function SetUpGUI() {
	const gui = new GUI({ name: 'Settings', autoPlace: false });
	document.getElementById('controler')!.appendChild(gui.domElement);
	gui.domElement.style.position = 'absolute';
	gui.domElement.style.top = '0px';
	gui.domElement.style.right = '0px';
	const LoongFolder = gui.addFolder('Loong');
	LoongFolder.add<ISettings['Loong']>(Settings.Loong, 'Rotate');
	const LightFolder = gui.addFolder('Light');
	LightFolder.add<ISettings['Light']>(Settings.Light, 'Rotate');
	LightFolder.add<ISettings['Light']>(Settings.Light, 'X', -20, 20);
	LightFolder.add<ISettings['Light']>(Settings.Light, 'Y', -20, 20);
	LightFolder.add<ISettings['Light']>(Settings.Light, 'Z', -20, 20);
	LightFolder.addColor(Settings.Light, 'LightColor');
	const ColorFolder = gui.addFolder('Color');
	ColorFolder.addColor(Settings.Color, 'objectColor');
	ColorFolder.addColor(Settings.Color, 'ambinColor');
	ColorFolder.add<ISettings['Color']>(Settings.Color, 'ambinStrength', 0, 1);
	ColorFolder.add<ISettings['Color']>(Settings.Color, 'specularStrength', 0, 1);
	ColorFolder.add<ISettings['Color']>(Settings.Color, 'specularConstant', 0, 1);
	ColorFolder.add<ISettings['Color']>(Settings.Color, 'specularLinear', 0, 1);
	ColorFolder.add<ISettings['Color']>(Settings.Color, 'specularQuadratic', 0, 1);
	gui.add<ISettings>(Settings, 'Skybox', ['Cloud', 'Garden']);
	gui.add<ISettings>(Settings, 'reflectSkyboxStrength', 0, 1);
	gui.add(
		{
			FullScreen: () => (document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen())
		},
		'FullScreen'
	);
	gui.add<ISettings>(Settings, 'DepthTexture');
}

export function SetUpStats(): Stats {
	const stats = new Stats();
	stats.showPanel(0);
	app.appendChild(stats.dom);
	return stats;
}

export function CreateVertexAndIndexBuffers(Vertex: Float32Array, Index: Uint16Array) {
	const VerticesBuffer = device.createBuffer({
		size: Vertex.byteLength,
		usage: GPUBufferUsage.VERTEX,
		mappedAtCreation: true
	});
	new Float32Array(VerticesBuffer.getMappedRange()).set(Vertex);
	VerticesBuffer.unmap();

	const IndexBuffer = device.createBuffer({
		size: Index.byteLength,
		usage: GPUBufferUsage.INDEX,
		mappedAtCreation: true
	});
	new Uint16Array(IndexBuffer.getMappedRange()).set(Index);
	IndexBuffer.unmap();

	return { VerticesBuffer, IndexBuffer };
}
