import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
// import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import ThreeWebContentCanvas from './ThreeWebContentCanvas';

class XRHub {
  constructor(container, camera) {
    this.container = container;
    this.perspCamera = camera;
    this.initVRScene();
    this.initWebContentScene();
    this.raycaster = new THREE.Raycaster();

    this.mouse = {x: -1, y: -1};
    this.initMouseControls();
    // this.controllers = [];
    // this.initControls();
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
    // this.webGLRenderer.domElement.style.pointerEvents = "none"; // required
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

    let url = 'https://threejs.org/'; // 'http://localhost:8080'; // 'https://threejs.org/examples/?q=css#css3d_youtube';
    const webContent = new ThreeWebContentCanvas(
      url,
      1024,
      768,
      'threejsorg',
      this.webGLScene,
      this.css3DScene
    );
    webContent.setPosition(-1, 1, -1);
    webContent.setRotationQuaternion(new THREE.Quaternion());
    webContent.setSize(1, 0.75);
    webContent.addToScenes(this.webGLScene, this.css3DScene);
  }

  /*
  initControls(){
    // const controllerModelFactory = new XRControllerModelFactory();
    for(let i = 0; i < 2; i++){
      // init controllers
      const controller = this.webGLRenderer.xr.getController(i);
      if(controller){
        this.controllers.push(controller);
        controller.addEventListener('selectstart', this.onSelectStart);
        controller.addEventListener('selectend', this.onSelectEnd);
        this.webGLScene.add(controller);
        const controllerGrip = this.webGLRenderer.xr.getControllerGrip(i);
        if(controllerGrip){
          const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
          const material = new THREE.MeshNormalMaterial();

          const mesh = new THREE.Mesh(geometry, material);
          // controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
          controllerGrip.add(mesh);
          this.webGLScene.add(controllerGrip);
        }

        // add selection line
        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
        line.scale.z = 5;

        controller.add(line.clone());
      }
    }
  }
  */

  initMouseControls(){
    this.handleMouseEvent = this.handleMouseEvent.bind(this);
    this.updateMouse = this.updateMouse.bind(this);
    this.container.addEventListener('mousemove', this.updateMouse);
    this.container.addEventListener('click', this.handleMouseEvent);
    this.container.addEventListener('contextmenu', this.handleMouseEvent);
    this.container.addEventListener('wheel', this.handleMouseEvent);
  }

  updateMouse(event){
    this.mouse = {
      x: event.x,
      y: event.y
    };
  }

  handleMouseEvent(event) {
    const intersectedObjects = event.x ? this.getRaycastIntersectionsFromScreenPos(event.x, event.y): this.getRaycastIntersectionsFromScreenPos(this.mouse.x, this.mouse.y);
    if (intersectedObjects.length) {
      const closestIntersection = intersectedObjects[0];
      if (closestIntersection.object.custom) {
        if(event.type === "wheel"){
          this.dispatchScroll(closestIntersection, event);
        } else {
          this.dispatchClick(closestIntersection);
        }

      }
    }
  }

  dispatchClick(intersection){
    const localIntersection = intersection.object.worldToLocal(intersection.point);
    const clientX = (localIntersection.x+0.5)*intersection.object.custom.res.x;
    const clientY = (localIntersection.y+0.5)*intersection.object.custom.res.y;
    const mouseEvent = new MouseEvent(event.type, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY
    });
    const domElement = intersection.object.custom.website.contentWindow.document.elementFromPoint(clientX, clientY);
    if(domElement){
      domElement.dispatchEvent(mouseEvent);
    }
  }

  dispatchScroll(closestIntersection, event){
    closestIntersection.object.custom.website.contentWindow.scroll(event.deltaX, event.deltaY);
  }

  getRaycastIntersectionsFromScreenPos(screenPosX, screenPosY){
    const eventXPosFromCenter = ((screenPosX-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const eventYPosFromCenter = ((screenPosY-this.container.offsetTop)/this.container.clientHeight)*2-1;
    const positionRelativeToContainer = new THREE.Vector3(eventXPosFromCenter, eventYPosFromCenter, 0);
    this.raycaster.setFromCamera(positionRelativeToContainer, this.perspCamera);
    return this.raycaster.intersectObjects(
      this.webGLScene.children
    );
  }

  onSelectStart(event){
    this.webGLRenderer.domElement.ownerDocument.alert("hey i selected something");
    return event;
  }

  onSelectEnd(event){
    // TODO: implement
    return event;
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
    plane.name = "groundPlane";
    this.webGLScene.add(plane);
  }

  createDemoCube() {
    let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    let material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1;
    this.mesh.name = "demoCube";
    this.webGLScene.add(this.mesh);
  }
}

export default XRHub;
