import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

class ThreeWebContentCanvas {
  constructor(url, webglScene, css3DScene) {
    this.url = url;

    this.webglScene = webglScene;
    this.css3DScene = css3DScene;

    this.webGLCanvas = this.createWebGLCanvas();
    this.webglScene.add(this.webGLCanvas);
    this.css3DCanvas = this.createCSS3DCanvas();
    this.css3DScene.add(this.css3DCanvas);
  }

  setPosition(x, y, z) {
    this.webGLCanvas.position.set(x, y, z);
    this.css3DCanvas.position.set(x, y, z);
  }

  setRotationQuaternion(quat) {
    this.webGLCanvas.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    this.css3DCanvas.quaternion.set(quat.x, quat.y, quat.z, quat.w);
  }

  createWebGLCanvas() {
    let material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide
    });
    material.color.set('white');
    material.opacity = 0;
    material.blending = THREE.NoBlending;

    let geometry = new THREE.PlaneGeometry();
    let webglPlaneMesh = new THREE.Mesh(geometry, material);

    return webglPlaneMesh;
  }

  createCSS3DCanvas() {
    var div = document.createElement('div');
    div.style.width = '480px';
    div.style.height = '360px';
    div.style.backgroundColor = '#000';

    var iframe = document.createElement('iframe');
    iframe.style.width = '480px';
    iframe.style.height = '360px';
    iframe.style.border = '0px';
    iframe.src = this.url;
    div.appendChild(iframe);

    var object = new CSS3DObject(div);

    return object;
  }
}

export default ThreeWebContentCanvas;
