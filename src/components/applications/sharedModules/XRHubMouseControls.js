import * as THREE from 'three';
import { CONFIG_CANVAS_NAME } from './XRHubConstants';


export class XRHubMouseControls {

  DISTANCE_TO_CAMERA = 1.5;

  constructor(container, roomId, camera, webGLScene, webGLMouseSphere, css3DScene, css3DMouseSpehre, roomService, toggleConfigCanvas) {
    this.container = container;
    this.roomId = roomId;
    this.camera = camera;
    this.webGLScene = webGLScene;
    this.webGLMouseSphere = webGLMouseSphere;
    this.css3DScene = css3DScene;
    this.css3DMouseSphere = css3DMouseSpehre;
    this.roomService = roomService;
    this.toggleConfigCanvas = toggleConfigCanvas;

    this.raycaster = new THREE.Raycaster();

    this.container.addEventListener('mousemove', this.updateMouse.bind(this));
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // createMouseSpheres() {
  //   const geometry = new THREE.SphereGeometry(0.01);
  //   const material = new THREE.MeshBasicMaterial();
  //
  //   const mesh = new THREE.Mesh(geometry, material);
  //   mesh.name = "webGLMouseSphere";
  //   this.webGLMouseSphere = mesh;
  //   this.css3DMouseSphere = mesh.clone();
  //   this.css3DMouseSphere.name = "css3DMouseSphere";
  //   this.webGLScene.add(this.webGLMouseSphere);
  //   this.css3DScene.add(this.css3DMouseSphere);
  // }

  updateMouse(event){
    const xNDC = ((event.x-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const yNDC = -((event.y-this.container.offsetTop)/this.container.clientHeight)*2+1;
    const mouseVector = new THREE.Vector3(xNDC, yNDC, 0);
    mouseVector.unproject(this.camera);
    const cameraWorldPos = new THREE.Vector3();
    this.camera.getWorldPosition(cameraWorldPos);
    mouseVector.sub(cameraWorldPos).normalize();
    mouseVector.multiplyScalar(this.DISTANCE_TO_CAMERA);
    this.webGLMouseSphere.position.copy(this.camera.position.clone().add(mouseVector));
    this.webGLMouseSphere.rotation.copy(this.camera.rotation);
    this.css3DMouseSphere.position.copy(this.camera.position.clone().add(mouseVector));
    this.css3DMouseSphere.rotation.copy(this.camera.rotation);
    const toRotate = this.webGLMouseSphere.userData.toRotate;
    if(toRotate){
      // rotateOnAxis("WebGL", toRotate.name, new THREE.Vector3(0,1,0), event.movementX*0.1, this.roomId, true);
      toRotate.rotateOnAxis(new THREE.Vector3(0,1,0), event.movementX*0.1);
      this.roomService.updateObject3D(toRotate, this.roomId);
      if(toRotate.userData.css3DObject){
        // rotateOnAxis("CSS3D", toRotate.userData.css3DObject.name, new THREE.Vector3(0,1,0), event.movementX*0.1, this.roomId, true);
        toRotate.userData.css3DObject.rotateOnAxis(new THREE.Vector3(0,1,0), event.movementX*0.1);
        this.roomService.updateObject3D(toRotate.userData.css3DObject, this.roomId);
      }
    }
    for(const child of this.webGLMouseSphere.children){
      this.roomService.updateObject3D(child, this.roomId);
    }
    for(const child of this.css3DMouseSphere.children){
      this.roomService.updateObject3D(child, this.roomId);
    }
  }

  handleMouseUp(event){
    if(event.button === 0){
      this.removeFollower(this.webGLMouseSphere, this.webGLScene);
      this.removeFollower(this.css3DMouseSphere, this.css3DScene);
      this.webGLMouseSphere.userData.toRotate = undefined;
    }
  }

  handleMouseDown(event){
    const intersectedObjects = this.raycastFromScreenCoordinates(event.x, event.y).filter(it => it.object.name !== this.webGLMouseSphere.name);
    if (intersectedObjects.length > 0) {
      const object = intersectedObjects[0].object;
      switch (event.button) {
        case 0:
          if(object.name !== "configCanvas"){
            if (object.name === "websiteMoveHandle") {
              this.addFollowerToParent(this.webGLMouseSphere, object.parent);
              this.addFollowerToParent(this.css3DMouseSphere, object.parent.userData.css3DObject);
            } else if (object.name === "websiteRotationHandle"){
              this.webGLMouseSphere.userData.toRotate = object.parent;
            } else if(!object.userData.canvasId){
              this.addFollowerToParent(this.webGLMouseSphere, object);
            }
          }
          break;
        case 1:
          break;
        case 2:
          // if (object.userData.updateUrl || object.name === CONFIG_CANVAS_NAME) {
          //   this.toggleConfigCanvas(object);
          // }
          break;
      }

    }
  }

  handleKeyDown(event){
    const intersectedObjects = this.raycastFromMousePosition();
    if (intersectedObjects.length > 0) {
      const object = intersectedObjects[0].object;
      if(event.code === "Space" && object.userData.toggleHandles){
        object.userData.toggleHandles();
      }
      if((event.code === "KeyE" && object.userData.css3DObject) || object.name === CONFIG_CANVAS_NAME){
        this.toggleConfigCanvas(object)
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
      const child = parent.userData.selected;
      child.matrix.premultiply( parent.matrixWorld );
      child.matrix.decompose( child.position, child.quaternion, child.scale );
      scene.add( child );
      parent.userData.selected = undefined;
    }
  }

  raycastFromScreenCoordinates(screenPosX, screenPosY){
    const eventXPosFromCenter = ((screenPosX-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const eventYPosFromCenter = -((screenPosY-this.container.offsetTop)/this.container.clientHeight)*2+1;
    const positionRelativeToContainer = new THREE.Vector3(eventXPosFromCenter, eventYPosFromCenter, 0);
    this.raycaster.setFromCamera(positionRelativeToContainer, this.camera);
    return this.raycaster.intersectObjects(
      this.getChildrenRecursive(this.webGLScene)
    );
  }

  raycastFromMousePosition(){
    const mouseWorldPosition = new THREE.Vector3();
    const cameraWorldPosition = new THREE.Vector3();
    this.webGLMouseSphere.getWorldPosition(mouseWorldPosition);
    this.camera.getWorldPosition(cameraWorldPosition);
    const direction = mouseWorldPosition.clone();
    direction.sub(cameraWorldPosition);
    this.raycaster.set(mouseWorldPosition, direction.normalize());
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

}