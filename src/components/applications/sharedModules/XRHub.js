import * as THREE from 'three';
import {
  CSS3DRenderer,
  CSS3DObject
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import FirstPersonControls from '../sharedModules/FirstPersonControls';

class XRHub {
  constructor(container) {
    this.container = container;
    this.initVRScene();
    this.initWebContentScene();
  }

  initVRScene() {
    this.scene = new THREE.Scene();
    this.createGroundPlane();

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.container.clientWidth / this.container.clientHeight,
      0.01,
      10
    );
    this.camera.position.y = 1;
    this.camera.position.z = 1;
    this.scene.add(this.camera);

    this.controls = new FirstPersonControls(this.camera, this.container);

    let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    let material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.renderer.domElement);
  }

  initWebContentScene() {
    this.webContentScene = new THREE.Scene();
    this.webContentRenderer = new CSS3DRenderer();
    this.webContentRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );

    let webpage = XRHub.createWebCanvas(
      'https://threejs.org/examples/?q=css#css3d_youtube',
      2,
      2,
      2,
      0
    );
    this.webContentScene.add(webpage);
  }

  createGroundPlane() {
    var geometry = new THREE.PlaneBufferGeometry(20, 20);
    geometry.rotateX(THREE.Math.degToRad(90));
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide
    });
    var plane = new THREE.Mesh(geometry, material);
    this.scene.add(plane);
  }

  static createWebCanvas(url, x, y, z, ry) {
    var div = document.createElement('div');
    div.style.width = '480px';
    div.style.height = '360px';
    div.style.backgroundColor = '#000';

    var iframe = document.createElement('iframe');
    iframe.style.width = '480px';
    iframe.style.height = '360px';
    iframe.style.border = '0px';
    iframe.src = url;
    div.appendChild(iframe);

    var object = new CSS3DObject(div);
    object.position.set(x, y, z);
    object.rotation.y = ry;

    return object;
  }
}

export default XRHub;
