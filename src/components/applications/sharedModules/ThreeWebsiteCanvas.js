import ThreeWebContentCanvas from './ThreeWebContentCanvas';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as THREE from 'three';

export class ThreeWebsiteCanvas extends ThreeWebContentCanvas{
  constructor(resolutionWidth, resolutionHeight, name, url) {
    super(resolutionWidth, resolutionHeight, name);
    this.updateUrl(url);

    this.webGLCanvas.userData.updateUrl = this.updateUrl.bind(this);
    this.createWebGLHandles();
  }

  createWebGLHandles (){
    let geometry = new THREE.BoxGeometry(0.2, 0.1, 0.01);
    let material = new THREE.MeshNormalMaterial();
    this.moveHandle = new THREE.Mesh(geometry, material);
    this.moveHandle.name = "websiteMoveHandle";

    geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05);
    material = new THREE.MeshNormalMaterial();
    this.rotationHandle = new THREE.Mesh(geometry, material);
    this.rotationHandle.name = "websiteRotationHandle";
    this.webGLCanvas.add(this.moveHandle);
    this.webGLCanvas.add(this.rotationHandle);
    this.moveHandle.position.set(0, this.webGLCanvas.scale.y/2+0.1, 0);
    this.rotationHandle.position.set(0, -this.webGLCanvas.scale.y/2-0.1, 0);
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

  createCSS3DCanvas() {
    // const div = document.createElement('div');
    // div.style.width = this.resolution[0] + 'px';
    // div.style.height = this.resolution[1] + 'px';
    // div.style.backgroundColor = '#000';

    const iframe = document.createElement('iframe');
    iframe.style.width = this.resolution[0] + 'px';
    iframe.style.height = this.resolution[1] + 'px';
    iframe.style.border = '0px';
    iframe.src = this.url;
    // div.appendChild(iframe);

    const object = new CSS3DObject(iframe);
    object.name = this.name;
    object.userData = {website: iframe};

    return object;
  }

  updateUrl(url){
    this.url = url;
    this.css3DCanvas.userData.website.src = url;
  }
}