import * as THREE from 'three';

class ThreeWebContentCanvas {
  constructor(resolutionWidth, resolutionHeight, name) {
    this.name = name;

    this.resolution = [resolutionWidth, resolutionHeight];
    this.css3DCanvas = this.createCSS3DCanvas();
    this.webGLCanvas = this.createWebGLCanvas(this.css3DCanvas);
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

  createWebGLCanvas(css3DCannvas) {
    let material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide
    });
    material.color.set('black');
    material.opacity = 0;
    material.blending = THREE.NoBlending;

    let geometry = new THREE.PlaneGeometry(1, 1);
    let webglPlaneMesh = new THREE.Mesh(geometry, material);
    webglPlaneMesh.name = this.name;
    webglPlaneMesh.userData = {
      res: {x: this.resolution[0], y: this.resolution[1]},
      css3DObject: css3DCannvas,
    };

    return webglPlaneMesh;
  }

  createCSS3DCanvas() {
    throw new Error("The method createCSS3DCanvas has to be implemented in the child class!");
    }


}

export default ThreeWebContentCanvas;
