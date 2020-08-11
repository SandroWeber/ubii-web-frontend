import * as THREE from 'three';
import uuidv4 from 'uuid/v4';

class ThreeWebContentCanvas {
  constructor(resolutionWidth, resolutionHeight, name, webGLCanvas, css3DObject) {
    this.name = name;
    this.canvasId = webGLCanvas ? webGLCanvas.userData.canvasId : uuidv4();

    this.resolution = [resolutionWidth, resolutionHeight];

    this.css3DCanvas = this.createCSS3DCanvas(css3DObject);
    this.webGLCanvas = this.createWebGLCanvas(webGLCanvas);
  }

  addToScenes(webGLScene, css3DScene) {
    if(!this.webGLCanvas.parent){
      webGLScene.add(this.webGLCanvas);
    }
    if(!this.css3DCanvas.parent){
      css3DScene.add(this.css3DCanvas);
    }
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

  createWebGLCanvas(webGLCanvas) {
    let webglPlaneMesh;
    if(webGLCanvas){
      webglPlaneMesh = webGLCanvas;
    } else {
      let material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide
      });
      material.color.set('black');
      material.opacity = 0;
      material.blending = THREE.NoBlending;

      let geometry = new THREE.PlaneGeometry(1, 1);
      webglPlaneMesh = new THREE.Mesh(geometry, material);
      webglPlaneMesh.name = this.name;
      webglPlaneMesh.userData.res= {x: this.resolution[0], y: this.resolution[1]};
      webglPlaneMesh.userData.canvasId = this.canvasId;
    }

    webglPlaneMesh.userData.css3DObject = this.css3DCanvas;

    return webglPlaneMesh;
  }

  createCSS3DCanvas() {
    throw new Error("The method createCSS3DCanvas has to be implemented in the child class!");
    }


}

export default ThreeWebContentCanvas;
