import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import ConfigCanvasVueComponent from './ConfigCanvasVueComponent';
import Vue from 'vue';
import ThreeWebContentCanvas from './ThreeWebContentCanvas';
import * as THREE from 'three';
import { CONFIG_CANVAS_NAME } from './XRHubConstants';

export class ThreeConfigCanvas extends ThreeWebContentCanvas{


  /**
   *
   * @param resolutionWidth {int}
   * @param resolutionHeight {int}
   * @param perspCamera {THREE.Camera}
   */
  constructor(resolutionWidth, resolutionHeight, perspCamera){
    super(resolutionWidth, resolutionHeight, CONFIG_CANVAS_NAME);
    this.perspCamera = perspCamera;
    this.webGLCanvas.visible = false;
    this.css3DCanvas.userData.container.style.visibility = "hidden";
  }

  /**
   * Creates a new THREE.CSS3DObject containing a ConfigCanvasVueComponent
   * @returns {THREE.CSS3DObject}
   */
  createCSS3DCanvas(){
    const container = document.createElement("div");
    container.id = "configCanvas";
    container.style.width = this.resolution[0]+"px";
    container.style.height = this.resolution[1]+"px";
    container.style.border = "red solid 2px";
    container.style.zIndex = "5";

    const css3DCanvas = new CSS3DObject(container);
    css3DCanvas.userData.container = container;

    const TextboxClass = Vue.extend(ConfigCanvasVueComponent);
    const dataObject = {
      urlObject: this,
    };
    const textbox = new TextboxClass({
      data() {
        return dataObject;
      }
    });
    textbox.$props.onReload = this.onReload.bind(this);
    textbox.$mount();
    container.appendChild(textbox.$el);
    return css3DCanvas;
  }

  /**
   * Calls the update URL callback of the given website object
   */
  onReload(){
    this.websiteObject.userData.updateUrl(this.url);
  }

  /**
   * Sets the local url property to the one from the given object
   * positions the both the WebGL and CSS3D part of the ConfigCanvas according to the given url
   * and toggle the visibility of the canvas
   * @param webGLWebsiteObject {THREE.Object3D}
   */
  toggle(webGLWebsiteObject){
    this.url = webGLWebsiteObject.userData.css3DObject.userData.url;
    this.websiteObject = webGLWebsiteObject;
    const position = new THREE.Vector3();
    webGLWebsiteObject.getWorldPosition(position);
    const cameraPosition = new THREE.Vector3();
    this.perspCamera.getWorldPosition(cameraPosition);
    const direction = position.sub(cameraPosition).normalize();
    direction.multiplyScalar(0.3);
    const newPosition = cameraPosition.clone().add(direction);
    this.setPosition(newPosition.x, newPosition.y, newPosition.z);
    this.webGLCanvas.lookAt(cameraPosition);
    this.css3DCanvas.lookAt(cameraPosition);
    this.webGLCanvas.visible = !this.webGLCanvas.visible;
    if(this.webGLCanvas.visible){
      this.css3DCanvas.userData.container.style.visibility = "visible";
    } else {
      this.css3DCanvas.userData.container.style.visibility = "hidden";
    }
  }
}