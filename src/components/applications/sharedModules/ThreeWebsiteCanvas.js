import ThreeWebContentCanvas from './ThreeWebContentCanvas';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as THREE from 'three';
import {
  WEBSITE_CANVAS_MOVE_HANDLE_NAME,
  WEBSITE_CANVAS_NAME_PREFIX,
  WEBSITE_CANVAS_ROTATION_HANDLE_NAME
} from './XRHubConstants';
import uuidv4 from 'uuid/v4';

export class ThreeWebsiteCanvas extends ThreeWebContentCanvas{
  constructor(resolutionWidth, resolutionHeight, url, webGLCanvas, css3DObject) {
    super(resolutionWidth, resolutionHeight, WEBSITE_CANVAS_NAME_PREFIX+url, webGLCanvas, css3DObject);
    this.updateUrl(url);

    this.webGLCanvas.userData.updateUrl = this.updateUrl.bind(this);
    this.createWebGLHandles(webGLCanvas);
  }

  createWebGLHandles (webGLCanvas){
    if(!webGLCanvas){
      let geometry = new THREE.BoxGeometry(0.2, 0.1, 0.01);
      let material = new THREE.MeshBasicMaterial();
      this.moveHandle = new THREE.Mesh(geometry, material);
      this.moveHandle.name = WEBSITE_CANVAS_MOVE_HANDLE_NAME;

      geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05);
      material = new THREE.MeshBasicMaterial();
      this.rotationHandle = new THREE.Mesh(geometry, material);
      this.rotationHandle.name = WEBSITE_CANVAS_ROTATION_HANDLE_NAME;
      this.webGLCanvas.add(this.moveHandle);
      this.webGLCanvas.add(this.rotationHandle);
      this.moveHandle.position.set(0, this.webGLCanvas.scale.y/2+0.1, 0);
      this.rotationHandle.position.set(0, -this.webGLCanvas.scale.y/2-0.1, 0);
    } else{
      this.moveHandle = this.webGLCanvas.children.find((child) => child.name === WEBSITE_CANVAS_MOVE_HANDLE_NAME);
      this.rotationHandle = this.webGLCanvas.children.find((child) => child.name === WEBSITE_CANVAS_ROTATION_HANDLE_NAME);
    }
    this.moveHandle.visible = false;
    this.rotationHandle.visible = false;
    this.webGLCanvas.userData.toggleHandles = this.toggleMovementHandles.bind(this);
  }

  toggleMovementHandles(){
    this.moveHandle.visible = !this.moveHandle.visible;
    this.rotationHandle.visible = !this.rotationHandle.visible;
  }

  setPosition(x, y, z) {
    super.setPosition(x, y, z);
  }

  addToScenes(webGLScene, css3DScene) {
    super.addToScenes(webGLScene, css3DScene);

    // const matrix = new THREE.Matrix4();d
    // this.webGLCanvas.matrix.premultiply(matrix);
    // this.webGLCanvas.matrix.decompose(this.webGLCanvas.position, this.webGLCanvas.quaternion, this.webGLCanvas.scale);
    // this.handle.add(this.webGLCanvas);
  }

  createCSS3DCanvas(css3DObject) {
    const iframe = document.createElement('iframe');
    iframe.style.width = this.resolution[0] + 'px';
    iframe.style.height = this.resolution[1] + 'px';
    iframe.style.border = '0px';
    iframe.src = this.url;
    const object = new CSS3DObject(iframe);
    object.name = this.name;
    object.userData.website = iframe;
    object.userData.url = this.url;
    object.userData.canvasId = this.canvasId;
    object.userData.objectId = css3DObject ? css3DObject.userData.objectId : uuidv4();
    object.uuid = css3DObject.uuid;
    if(css3DObject){
      object.position.copy(css3DObject.position);
      object.rotation.copy(css3DObject.rotation);
      object.scale.copy(css3DObject.scale);
    }


    return object;
  }

  updateUrl(url){
    this.url = url;
    this.name = WEBSITE_CANVAS_NAME_PREFIX+url;
    this.webGLCanvas.name = this.name;
    this.css3DCanvas.name = this.name;
    this.css3DCanvas.userData.url = this.url;
    this.css3DCanvas.element.src = url;
  }
}