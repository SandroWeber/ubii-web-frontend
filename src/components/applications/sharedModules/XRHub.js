import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
// import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import ThreeWebContentCanvas from './ThreeWebContentCanvas';
import { MeshNormalMaterial } from 'three';

class XRHub {
  constructor(container, camera) {
    this.container = container;
    this.perspCamera = camera;
    this.perspCamera.position.set(0, 0, 5);
    this.initVRScene();
    this.initWebContentScene();
    this.createMouseSphere();
    this.spawnWebContent('https://threejs.org/');
    this.raycaster = new THREE.Raycaster();
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


  }

  spawnWebContent(url){
    // let url = 'https://threejs.org/'; // 'http://localhost:8080'; // 'https://threejs.org/examples/?q=css#css3d_youtube';
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

  raycastFromScreenCoordinates(screenPosX, screenPosY){
    const eventXPosFromCenter = ((screenPosX-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const eventYPosFromCenter = -((screenPosY-this.container.offsetTop)/this.container.clientHeight)*2+1;
    const positionRelativeToContainer = new THREE.Vector3(eventXPosFromCenter, eventYPosFromCenter, 0);
    this.raycaster.setFromCamera(positionRelativeToContainer, this.perspCamera);
    return this.raycaster.intersectObjects(
      this.webGLScene.children
    );
  }

  initMouseControls(){
    this.container.addEventListener('mousemove', this.updateMouse.bind(this));
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
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
  }

  handleMouseDown(event){
    const intersectedObjects = this.raycastFromScreenCoordinates(event.x, event.y);
    if (intersectedObjects.length > 0 && event.button === 1) {
      let object = intersectedObjects[0].object;
      if (object.name === this.webGLMouseSphere.name && intersectedObjects.length > 1) {
        object = intersectedObjects[1].object;
      }
      this.addFollowerToParent(this.webGLMouseSphere, object);
      if (object.userData.website !== undefined) {
        this.addFollowerToParent(this.css3DMouseSpehre, object.userData.css3DObject);
      }
    }
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
      const object = parent.userData.selected;
      object.matrix.premultiply( parent.matrixWorld );
      object.matrix.decompose( object.position, object.quaternion, object.scale );
      scene.add( object );
      parent.userData.selected = undefined;
    }
  }

  handleMouseUp(event){
    if(event.button === 1){
      this.removeFollower(this.webGLMouseSphere, this.webGLScene);
      this.removeFollower(this.css3DMouseSpehre, this.css3DScene);
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

  createMouseSphere() {
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
}

export default XRHub;
