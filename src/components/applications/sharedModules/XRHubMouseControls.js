import * as THREE from 'three';
import { CONFIG_CANVAS_NAME } from './XRHubConstants';


export class XRHubMouseControls {

  DISTANCE_TO_CAMERA = 1.5;

  /**
   *
   * @param container {Element}the container of the three.js scene
   * @param roomId  {String}
   * @param camera {THREE.Camera}
   * @param webGLScene {THREE.Scene}
   * @param webGLMouseSphere {THREE.Object3D}
   * @param css3DScene {THREE.Scene}
   * @param css3DMouseSpehre {THREE.Object3D}
   * @param roomService {XRHubRoomService}
   * @param toggleConfigCanvas {callback} callback to toggle the ThreeConfigCanvas in a Scene
   */
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

  /**
   * Calculates new mouse coordinates from the given MouseEvent.
   * Then updates the position of both mouse spheres in the WebGL and CSS3D scene, with the calculated position.
   * @param event {MouseEvent}
   */
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
    this.updateObjects(event);
  }

  /**
   * Rotates all objects that are appended to the userData.toRotate property from the webGLMouseSphere
   * Sends updates for all rotated objects and all child objects of both mouse spheres.
   * @param event {MouseEvent}
   */
  updateObjects(event){
    const toRotate = this.webGLMouseSphere.userData.toRotate;
    if(toRotate){
      toRotate.rotateOnAxis(new THREE.Vector3(0,1,0), event.movementX*0.1);
      this.roomService.updateObject3D(toRotate, this.roomId);
      if(toRotate.userData.css3DObject){
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

  /**
   * Handles if a mouseup event has occurred.
   * Removes all children from both mouse spheres and clears the userData.toRotate property
   * @param event {MouseEvent}
   */
  handleMouseUp(event){
    if(event.button === 0){
      this.removeFollower(this.webGLMouseSphere, this.webGLScene);
      this.removeFollower(this.css3DMouseSphere, this.css3DScene);
      this.webGLMouseSphere.userData.toRotate = undefined;
    }
  }

  /**
   * Handles the mousedown MouseEvent
   * Gets the object closest to the mouse sphere which is intersecting the raycast from the camera through the sphere
   * According to the mouse button that has been pressed it applies the corresponding action to that object
   * event.button = 0 -> left mouse button has been pressed
   * event.button = 1 -> middle mouse button has been pressed
   * event.button = 2 -> right mouse button has been pressed
   * @param event {MouseEvent}
   */
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
          break;
      }

    }
  }

  /**
   *  Handles the keydown KeyboardEvent
   *  Gets the object closest to the mouse sphere which is intersecting the raycast from the camera through the sphere
   *  Applies a certain action to that object depending on the key that has been pressed
   * @param event {KeyboardEvent}
   */
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

  /**
   * Transforms the follower object into object space of the parent object
   * Then attaches the follower object as a child to the parent.
   * @param parent {THREE.Object3D}
   * @param follower {THREE.Object3D}
   */
  addFollowerToParent(parent, follower){
    const matrix = new THREE.Matrix4;
    matrix.getInverse( parent.matrixWorld );
    follower.matrix.premultiply( matrix );
    follower.matrix.decompose( follower.position, follower.quaternion, follower.scale );
    parent.add( follower );
    parent.userData.selected = follower;
  }

  /**
   * Takes the object referenced in userData.selected property of the parent object
   * Transforms it into world space, and adds it to the scene, wich means it gets removed from the parent
   * @param parent {THREE.Object3D}
   * @param scene {THREE.Scene}
   */
  removeFollower(parent, scene){
    if(parent.userData.selected !== undefined){
      const child = parent.userData.selected;
      child.matrix.premultiply( parent.matrixWorld );
      child.matrix.decompose( child.position, child.quaternion, child.scale );
      scene.add( child );
      parent.userData.selected = undefined;
    }
  }

  /**
   * Sends a raycast into the scene from the given position transformed into NDC into the direction the camera is looking
   * @param screenPosX {Integer} screenX property from a MouseEvent
   * @param screenPosY {Integer} screenX property from a MouseEvent
   * @returns {Intersection[]} all objects that intersect with the ray sent from the given position
   */
  raycastFromScreenCoordinates(screenPosX, screenPosY){
    const eventXPosFromCenter = ((screenPosX-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const eventYPosFromCenter = -((screenPosY-this.container.offsetTop)/this.container.clientHeight)*2+1;
    const positionRelativeToContainer = new THREE.Vector3(eventXPosFromCenter, eventYPosFromCenter, 0);
    this.raycaster.setFromCamera(positionRelativeToContainer, this.camera);
    return this.raycaster.intersectObjects(
      this.getChildrenRecursive(this.webGLScene)
    );
  }

  /**
   * Sends a raycast into the scene from the mouse sphere position into the direction of the mouse sphere position substracted by the camera position
   * @returns {Intersection[]} all objects that intersect with the ray sent from the mouse sphere position
   */
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

  /**
   * Returns all children of the given object in a flat array
   * @param object3D {THREE.Object3D}
   * @returns {[]} {THREE.Object3D[]}
   */
  getChildrenRecursive (object3D) {
    let children = [];
    object3D.children.forEach(child =>{
      children.push(child);
      children = children.concat(this.getChildrenRecursive(child));
    });
    return children;
  }

}