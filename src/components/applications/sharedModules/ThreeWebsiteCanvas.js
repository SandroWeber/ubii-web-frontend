import ThreeWebContentCanvas from './ThreeWebContentCanvas';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as THREE from 'three';
import {
  WEBSITE_CANVAS_MOVE_HANDLE_NAME,
  WEBSITE_CANVAS_NAME_PREFIX,
  WEBSITE_CANVAS_ROTATION_HANDLE_NAME
} from './XRHubConstants';

export class ThreeWebsiteCanvas extends ThreeWebContentCanvas{
  /**
   *
   * @param resolutionWidth {int}
   * @param resolutionHeight {int}
   * @param url {String}
   * @param webGLCanvas {THREE.Object3D}
   * @param css3DObject {THREE.Object3D}
   */
  constructor(resolutionWidth, resolutionHeight, url, webGLCanvas, css3DObject) {
    super(resolutionWidth, resolutionHeight, WEBSITE_CANVAS_NAME_PREFIX+url, webGLCanvas, css3DObject);
    this.updateUrl(url);

    this.webGLCanvas.userData.updateUrl = this.updateUrl.bind(this);
    this.createWebGLHandles(webGLCanvas);
  }

  /**
   * If no object is passed new handles to move and rotate are created and added as children to the object
   * Else the properties of the given object regarding its handles are updated
   * @param webGLCanvas {THREE.Object3D}
   */
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

  /**
   * toggles the visibility of the move and rotation handle
   */
  toggleMovementHandles(){
    this.moveHandle.visible = !this.moveHandle.visible;
    this.rotationHandle.visible = !this.rotationHandle.visible;
  }

  /**
   * Sets the position of both the WebGL- and CSS3DCanvas
   * @param x {int}
   * @param y {int}
   * @param z {int}
   */
  setPosition(x, y, z) {
    super.setPosition(x, y, z);
  }

  /**
   * adds the canvases to the scenes
   * @param webGLScene {THREE.Scene}
   * @param css3DScene {THREE.Scene}
   */
  addToScenes(webGLScene, css3DScene) {
    super.addToScenes(webGLScene, css3DScene);
  }

  /**
   * creates a new CSS3DCanvas object with an iframe inside
   * If an object is passed, the properties of the given objects are copied onto the new one
   * @param css3DObject {THREE.CSS3DObject}
   * @returns {THREE.CSS3DObject}
   */
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
    if(css3DObject){
      object.uuid = css3DObject.uuid;
      object.position.copy(css3DObject.position);
      object.rotation.copy(css3DObject.rotation);
      object.scale.copy(css3DObject.scale);
    }


    return object;
  }

  /**
   * updates the url in the src property of the iframe in the CSS3DCanvas to the given url
   * And updates all properties of the objects and the ThreeWebsiteCanvas instance
   * @param url {String}
   */
  updateUrl(url){
    this.url = url;
    this.name = WEBSITE_CANVAS_NAME_PREFIX+url;
    this.webGLCanvas.name = this.name;
    this.css3DCanvas.name = this.name;
    this.css3DCanvas.userData.url = this.url;
    this.css3DCanvas.element.src = url;
  }
}