import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import ThreeWebContentCanvas from './ThreeWebContentCanvas';

class XRHub {
  constructor(container) {
    this.container = container;
    this.initVRScene();
    this.initWebContentScene();
  }

  initVRScene() {
    this.webGLScene = new THREE.Scene();
    this.webGLScene.background = new THREE.Color('skyblue');

    this.createGroundPlane();
    this.createDemoCube();

    this.webGLRenderer = new THREE.WebGLRenderer({
      alpha: true /*, antialias: true*/
    });
    this.webGLRenderer.domElement.style.position = 'absolute'; // required (??)
    this.webGLRenderer.setClearColor(0x000000, 0); // required
    this.webGLRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.webGLRenderer.domElement.style.zIndex = '1'; // required
    this.webGLRenderer.domElement.style.pointerEvents = "none"; // required
    this.container.appendChild(this.webGLRenderer.domElement);
  }

  initWebContentScene() {
    this.css3DScene = new THREE.Scene();
    this.css3DRenderer = new CSS3DRenderer();
    this.css3DRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.css3DRenderer.domElement);

    let url = 'https://threejs.org/'; // 'https://threejs.org/examples/?q=css#css3d_youtube';
    let webContent = new ThreeWebContentCanvas(
      url,
      1024,
      768,
      this.webGLScene,
      this.css3DScene
    );
    webContent.setPosition(-1, 1, -1);
    webContent.setRotationQuaternion(new THREE.Quaternion());
    webContent.setSize(1, 0.75);
    webContent.addToScenes(this.webGLScene, this.css3DScene);
  }

  update(delta) {
    this.mesh.rotation.x += delta;
    this.mesh.rotation.y += delta;
  }

  createGroundPlane() {
    var geometry = new THREE.PlaneBufferGeometry(20, 20);
    geometry.rotateX(THREE.Math.degToRad(90));
    var material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide
    });
    var plane = new THREE.Mesh(geometry, material);
    this.webGLScene.add(plane);
  }

  createDemoCube() {
    let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    let material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1;
    this.webGLScene.add(this.mesh);
  }
}

export default XRHub;
