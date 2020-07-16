import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
// import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import { MeshNormalMaterial } from 'three';
import { ThreeConfigCanvas } from './ThreeConfigCanvas';
import { ThreeWebsiteCanvas } from './ThreeWebsiteCanvas';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import uuidv4 from 'uuid/v4';
import Dispatcher, { registerDevice, rotateOnAxis, subscribeToRoom } from './AsyncXRHubActionCreators';
/* eslint-disable no-console */

class XRHub {
  constructor(container, camera, roomId = uuidv4()) {
    this.roomId = roomId;
    this.container = container;
    this.perspCamera = camera;
    this.perspCamera.position.set(0, 0, 5);
    this.acceptActions = this.acceptActions.bind(this);
    Dispatcher.subscribe(this.acceptActions);
    this.registerAndSubscribe();
    this.initVRScene();
    this.initWebContentScene();
    this.spawnWebContent('https://threejs.org/');
    this.raycaster = new THREE.Raycaster();
    this.initMouseControls();
    this.createInteractionToggleButton();
    // this.controllers = [];
    // this.initControls();
    this.configHUD = new ThreeConfigCanvas(1024, 768, "configCanvas", this.perspCamera, this.togglePointerEvents);
    this.configHUD.addToScenes(this.webGLScene, this.css3DScene);
    this.configHUD.setPosition(-1, 1, 0);
    this.configHUD.setRotationQuaternion(new THREE.Quaternion());
    this.configHUD.setSize(0.3, 0.25);
  }

  initVRScene() {
    this.webGLScene = new THREE.Scene();
    this.webGLScene.background = new THREE.Color('skyblue');

    this.createGroundPlane();
    this.createDemoCube();

    this.webGLRenderer = new THREE.WebGLRenderer({
      alpha: true , antialias: false
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

  initMouseControls(){
    this.container.addEventListener('mousemove', this.updateMouse.bind(this));
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.createMouseSpheres();
  }

  initWebContentScene() {
    this.css3DScene = new THREE.Scene();
    this.css3DRenderer = new CSS3DRenderer();
    this.css3DRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.css3DRenderer.domElement);
  }

  registerAndSubscribe(){
    this.device = {
      name: 'XR-Hub',
      deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
      components: [
      {
        topic: 'web-xr-hub/'+ this.roomId,
        messageFormat: 'string',
        ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
      }]
    };

    return registerDevice(this.device).then(device => {
      this.device = device;
      return subscribeToRoom(this.roomId);
    });
  }

  acceptActions(action){
    console.log("accepting action", action);
    const scene = action.scene === "WebGL" ? this.webGLScene : this.css3DScene;
    if(action.type === "RotateOnAxis"){
      const object = scene.getObjectByName(action.objectId);
      object.rotateOnAxis(action.axis, action.angle);
    }
  }

  spawnWebContent(url){
    // let url = 'https://threejs.org/'; // 'http://localhost:8080'; // 'https://threejs.org/examples/?q=css#css3d_youtube';
    const webContent = new ThreeWebsiteCanvas(
      1024,
      768,
      'threejsorg',
      url
    );
    webContent.addToScenes(this.webGLScene, this.css3DScene);
    webContent.setPosition(-1, 1, -1);
    webContent.setRotationQuaternion(new THREE.Quaternion());
    webContent.setSize(1, 0.75);
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

  raycastFromScreenCoordinates(screenPosX, screenPosY){
    const eventXPosFromCenter = ((screenPosX-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const eventYPosFromCenter = -((screenPosY-this.container.offsetTop)/this.container.clientHeight)*2+1;
    const positionRelativeToContainer = new THREE.Vector3(eventXPosFromCenter, eventYPosFromCenter, 0);
    this.raycaster.setFromCamera(positionRelativeToContainer, this.perspCamera);
    return this.raycaster.intersectObjects(
      this.getChildrenRecursive(this.webGLScene)
    );
  }

  getChildrenRecursive (object3D) {
    let children = [];
    object3D.children.forEach(child =>{
      children.push(child);
      children = children.concat(this.getChildrenRecursive(child));
    });
    return children;
  }



  updateMouse(event){
    const xNDC = ((event.x-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const yNDC = -((event.y-this.container.offsetTop)/this.container.clientHeight)*2+1;
    const mouseVector = new THREE.Vector3(xNDC, yNDC, 0);
    mouseVector.unproject(this.perspCamera);
    mouseVector.sub(this.perspCamera.position).normalize();
    const distance = this.webGLMouseSphere.position.distanceTo(this.perspCamera.position);
    this.webGLMouseSphere.position.copy(this.perspCamera.position.clone().add(mouseVector.multiplyScalar(distance)));
    this.css3DMouseSpehre.position.copy(this.perspCamera.position.clone().add(mouseVector.multiplyScalar(distance)));
    const toRotate = this.webGLMouseSphere.userData.toRotate;
    if(toRotate){
      rotateOnAxis("WebGL", toRotate.name, new THREE.Vector3(0,1,0), event.movementX*0.1, this.roomId, true);
      // toRotate.rotateOnAxis(new THREE.Vector3(0,1,0), event.movementX*0.1);
      if(toRotate.userData.css3DObject){
        rotateOnAxis("CSS3D", toRotate.userData.css3DObject.name, new THREE.Vector3(0,1,0), event.movementX*0.1, this.roomId, true);
        // toRotate.userData.css3DObject.rotateOnAxis(new THREE.Vector3(0,1,0), event.movementX*0.1);
      }
    }
  }

  handleMouseDown(event){
    const intersectedObjects = this.raycastFromScreenCoordinates(event.x, event.y).filter(it => it.object.name !== this.webGLMouseSphere.name);
    if (intersectedObjects.length > 0) {
      const object = intersectedObjects[0].object;
      switch (event.button) {
        case 0:
          if(object.userData.updateUrl){
            // const iframe = object.userData.css3DObject.userData.website;
            // const element = iframe.elementFromPoint(100, 100);
            // element.click();
          }
          break;
        case 1:
          if(object.name !== "configCanvas"){
            if (object.name === "websiteMoveHandle") {
              this.addFollowerToParent(this.webGLMouseSphere, object.parent);
              this.addFollowerToParent(this.css3DMouseSpehre, object.parent.userData.css3DObject);
            } else if (object.name === "websiteRotationHandle"){
              this.webGLMouseSphere.userData.toRotate = object.parent;
            } else {
              this.addFollowerToParent(this.webGLMouseSphere, object);
            }
          }
          break;
        case 2:
          // this.configHUD.toggle();
          if (object.userData.updateUrl || object.name === "configCanvas") {
            this.configHUD.toggle(object);
            this.togglePointerEvents();
          }
          break;
      }

    }
  }

  togglePointerEvents(){
    const current = this.webGLRenderer.domElement.style.pointerEvents;
    this.webGLRenderer.domElement.style.pointerEvents = current === "none" && current.length > 0 ? "all": "none";
  }

  addFollowerToParent(parent, follower){
    const matrix = new THREE.Matrix4;
    matrix.getInverse( parent.matrixWorld );
    follower.matrix.premultiply( matrix );
    follower.matrix.decompose( follower.position, follower.quaternion, follower.scale );
    parent.add( follower );
    parent.userData.selected = follower;
  }

  removeFollower(parent, scene){
    if(parent.userData.selected !== undefined){
      const child = parent.userData.selected;
      child.matrix.premultiply( parent.matrixWorld );
      child.matrix.decompose( child.position, child.quaternion, child.scale );
      scene.add( child );
      parent.userData.selected = undefined;
    }
  }

  handleMouseUp(event){
    if(event.button === 1){
      this.removeFollower(this.webGLMouseSphere, this.webGLScene);
      this.removeFollower(this.css3DMouseSpehre, this.css3DScene);
      this.webGLMouseSphere.userData.toRotate = undefined;
    }
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

  createMouseSpheres() {
    const geometry = new THREE.SphereGeometry(0.01);
    const material = new MeshNormalMaterial();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "webGLmouseSphere";
    this.webGLMouseSphere = mesh;
    this.css3DMouseSpehre = mesh.clone();
    this.css3DMouseSpehre.name = "css3DMouseSpehre";
    this.webGLScene.add(this.webGLMouseSphere);
    this.css3DScene.add(this.css3DMouseSpehre);
  }

  createInteractionToggleButton(){
    const button = document.createElement("button");
    button.style.width = 200+"px";
    button.style.height = 20+"px";
    button.style.position = "absolute";
    button.style.top = 100+"px";
    button.style.right = 10+"px";
    button.style.textAlign=  "center";
    button.style.zIndex = 100;
    button.style.display = "block";
    button.innerText = "Toggle Website Interaction";
    button.addEventListener("click", this.togglePointerEvents.bind(this));
    document.documentElement.appendChild(button);
  }
}

export default XRHub;
