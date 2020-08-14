import * as THREE from 'three';
import uuidv4 from 'uuid/v4';

class ThreeWebContentCanvas {
  /**
   *
   * @param resolutionWidth
   * @param resolutionHeight
   * @param name
   * @param webGLCanvas
   * @param css3DObject
   */
  constructor(resolutionWidth, resolutionHeight, name, webGLCanvas, css3DObject) {
    this.name = name;
    this.canvasId = webGLCanvas ? webGLCanvas.userData.canvasId : uuidv4();

    this.resolution = [resolutionWidth, resolutionHeight];

    this.css3DCanvas = this.createCSS3DCanvas(css3DObject);
    this.webGLCanvas = this.createWebGLCanvas(webGLCanvas);
  }

  /**
   * Adds the WebGL object to the given WebGL scene if the object has not parent yet
   * Adds the CSS3D object to the given CSS3D scene if the object has not parent yet
   * @param webGLScene {THREE.Scene}
   * @param css3DScene {THREE.Scene}
   */
  addToScenes(webGLScene, css3DScene) {
    if(!this.webGLCanvas.parent){
      webGLScene.add(this.webGLCanvas);
    }
    if(!this.css3DCanvas.parent){
      css3DScene.add(this.css3DCanvas);
    }
  }

  /**
   * Sets the position for both the CSS3D and the WebGL object
   * @param x {int}
   * @param y {int}
   * @param z {int}
   */
  setPosition(x, y, z) {
    this.webGLCanvas.position.set(x, y, z);
    this.css3DCanvas.position.set(x, y, z);
  }

  /**
   * Applies the given quaternion to both the WebGL and CSS3D object
   * @param quat {THREE.Quaternion}
   */
  setRotationQuaternion(quat) {
    this.webGLCanvas.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    this.css3DCanvas.quaternion.set(quat.x, quat.y, quat.z, quat.w);
  }

  /**
   * Sets the scale of both the WebGL and CSS3D object
   * @param x {int}
   * @param y {int}
   */
  setSize(x, y) {
    this.webGLCanvas.scale.set(x, y, 1);

    let factorX = 1 / this.resolution[0];
    let factorY = 1 / this.resolution[1];
    this.css3DCanvas.scale.set(factorX * x, factorY * y, 1);
  }

  /**
   * Creates a new plane mesh as representation of the web content in the WebGL scene
   * If a object is passed only the properties of the given object are updated
   * @param webGLCanvas{THREE.Object3D}
   * @returns {Mesh}
   */
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
