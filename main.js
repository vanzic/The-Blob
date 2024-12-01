import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GUI } from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const loadingManager = new THREE.LoadingManager();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const rgbeLoader = new RGBELoader(loadingManager);
rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/studio_small_09_4k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture;
});

const geometry = new THREE.IcosahedronGeometry(2, 100, 100);

const material = new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: vertexShader,
    uniforms: {
      uTime: { value: 0.0 },
      uPositionFrequency: { value: 0.5 },
      uPositionStrength: { value: 0.5 },
      uTimeFrequency: { value: 0.5 },
      uSmallWavePositionFrequency: { value: 0.5 },
      uSmallWavePositionStrength: { value: 0.5 },
      uSmallWaveTimeFrequency: { value: 0.5 },  
    },
    map: new THREE.TextureLoader(loadingManager).load('./gradients/purple-rain.png'),
    clearcoat: 1,
    clearcoatRoughness: 0,
    metalness: 0.5,
    roughness: 0.1
});

const mergedGeometry = mergeVertices(geometry);
mergedGeometry.computeTangents();

const sphere = new THREE.Mesh(mergedGeometry, material);
scene.add(sphere);

const gui = new GUI();
gui.add(material.uniforms.uPositionFrequency, 'value', 0, 2).name('Wave Position');
gui.add(material.uniforms.uPositionStrength, 'value', 0, 2).name('Wave Strength');
gui.add(material.uniforms.uTimeFrequency, 'value', 0, 2).name('Time Frequency');
gui.add(material.uniforms.uSmallWavePositionFrequency, 'value', 0, 2).name('Wave 1');
gui.add(material.uniforms.uSmallWavePositionStrength, 'value', 0, 2).name('Wave 2');
gui.add(material.uniforms.uSmallWaveTimeFrequency, 'value', 0, 2).name('Wave 3');

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

camera.position.z = 5;

const clock = new THREE.Clock();

const controls = new OrbitControls(camera, renderer.domElement);
const toggleButton = document.getElementById('toggleButton1');

let orbitControlsEnabled = false; 
controls.enabled = orbitControlsEnabled;

toggleButton.addEventListener('click', () => {
    orbitControlsEnabled = !orbitControlsEnabled; 
    controls.enabled = orbitControlsEnabled; 

    if (orbitControlsEnabled) {
        toggleButton.classList.add('active'); 
    } else {
        toggleButton.classList.remove('active'); 
    }
    rotate3D();
});

document.body.addEventListener('click', () => {
    const btn = document.getElementById('toggleButton');

    if (!orbitControlsEnabled) {
        btn.classList.add('shake'); 
        setTimeout(() => {
            btn.classList.remove('shake');  
        }, 500); 
    }
});

function rotate3D(){
    const clockRotate = new THREE.Clock();
    function scaleUp(){
        sphere.scale.x += 0.01;
        sphere.scale.y += 0.01;
        if(clockRotate.getElapsedTime() > 0.25){
            scaleDown();
            return;
        }
        requestAnimationFrame(scaleUp);
    }
    function scaleDown(){
        sphere.scale.x -= 0.01;
        sphere.scale.y -= 0.01;
        if(clockRotate.getElapsedTime() > 0.5){
            return;
        }
        requestAnimationFrame(scaleDown);
    }
    scaleUp();
}

function animate() {
    requestAnimationFrame(animate);

    material.uniforms.uTime.value = clock.getElapsedTime();
    
    if (orbitControlsEnabled) {
        controls.update();
    }
    
    renderer.render(scene, camera);
}

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
};

loadingManager.onLoad = () => {
    document.getElementById('loadingOverlay').style.display = 'none';
    animate();
}