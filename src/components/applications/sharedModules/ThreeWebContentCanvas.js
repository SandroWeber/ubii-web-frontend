import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class ThreeWebContentCanvas {
  constructor(url, resolutionWidth, resolutionHeight) {
    this.url = url;

    this.resolution = [resolutionWidth, resolutionHeight];

    this.webGLCanvas = this.createWebGLCanvas();
    this.css3DCanvas = this.createCSS3DCanvas();
  }

  addToScenes(webGLScene, css3DScene) {
    webGLScene.add(this.webGLCanvas);
    css3DScene.add(this.css3DCanvas);
  }

  setPosition(x, y, z) {
    this.webGLCanvas.position.set(x, y, z);
    this.css3DCanvas.position.set(x, y, z);
  }

  setRotationQuaternion(quat) {
    this.webGLCanvas.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    this.css3DCanvas.quaternion.set(quat.x, quat.y, quat.z, quat.w);
  }

  setSize(x, y) {
    this.webGLCanvas.scale.set(x, y, 1);

    let factorX = 1 / this.resolution[0];
    let factorY = 1 / this.resolution[1];
    this.css3DCanvas.scale.set(factorX * x, factorY * y, 1);
  }

  createWebGLCanvas() {
    let material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide
    });
    material.color.set('white');
    material.opacity = 0;
    material.blending = THREE.NoBlending;

    let geometry = new THREE.PlaneGeometry(1, 1);
    let webglPlaneMesh = new THREE.Mesh(geometry, material);

    return webglPlaneMesh;
  }

  createCSS3DCanvas() {
    var div = document.createElement('div');
    div.style.width = this.resolution[0] + 'px';
    div.style.height = this.resolution[1] + 'px';
    div.style.backgroundColor = '#000';

    var iframe = document.createElement('iframe');
    iframe.style.width = this.resolution[0] + 'px';
    iframe.style.height = this.resolution[1] + 'px';
    iframe.style.border = '0px';
    iframe.src = this.url;
    div.appendChild(iframe);

    var object = new CSS3DObject(div);

    return object;
  }
}

export default ThreeWebContentCanvas;
