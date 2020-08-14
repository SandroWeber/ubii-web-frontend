/* eslint-disable no-console */
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { ThreeWebsiteCanvas } from './ThreeWebsiteCanvas';
import {XRHubRoomService} from './XRHubRoomService';
import { XRHubMouseControls } from './XRHubMouseControls';
import { CONFIG_CANVAS_NAME, CSS3D_MOUSE_SPHERE_NAME, WEB_GL_MOUSE_SPHERE_NAME } from './XRHubConstants';
import { ThreeConfigCanvas } from './ThreeConfigCanvas';


class XRHub {
  /**
   *
   * @param container {Element} DOM element of the render container
   * @param camera {THREE.Camera}
   * @param roomId {String} room id contained in the url or undefined
   * @param controls {Controls}
   */
  constructor(container, camera, roomId, controls) {
    this.roomId = roomId;
    this.container = container;
    this.perspCamera = camera;
    this.controls = controls;
    this.perspCamera.position.set(0, 0, 5);
    this.togglePointerEvents = this.togglePointerEvents.bind(this);
    this.toggleConfigCanvas = this.toggleConfigCanvas.bind(this);
    this.initRoom();
  }

  /**
   *  initializes the room by creating the new scene, getting the room data for the id and deserializing received scenes into THREE.Scenes
   *  Finally it initializes the webcontent and the mouse controls
   * @returns {Promise<void>}
   */
  async initRoom(){
    this.webGLScene = new THREE.Scene();
    this.webGLScene.background = new THREE.Color('skyblue');
    this.css3DScene = new THREE.Scene();
    this.initWebGLRenderer();
    this.initCSS3DRenderer();
    this.roomService = new XRHubRoomService();
    const roomData = await this.roomService.getRoomData(this.roomId);
    if(roomData.error){
      console.info("Error loading room data", roomData.error);
    } else {
      this.roomId = roomData.success.id !== this.roomId ? roomData.success.id : this.roomId;
      await this.roomService.registerAndSubscribe(this.roomId, this.updateObject3D.bind(this));
      const loader = new THREE.ObjectLoader();
      this.webGLScene.add(...loader.parse(roomData.success["webGL"]).children);
      this.css3DScene.add(...loader.parse(roomData.success["css3D"]).children);
      this.initWebContent();
      this.initConfigCanvas();
      const webGLMouseSphere = this.webGLScene.getObjectByName(WEB_GL_MOUSE_SPHERE_NAME);
      const css3DMouseSphere = this.css3DScene.getObjectByName(CSS3D_MOUSE_SPHERE_NAME);
      this.mouseControls = new XRHubMouseControls(this.container, this.roomId, this.perspCamera, this.webGLScene, webGLMouseSphere, this.css3DScene, css3DMouseSphere, this.roomService, this.toggleConfigCanvas);
    }
  }

  /**
   * Initializes the WebGLRenderer
   */
  initWebGLRenderer(){
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

  /**
   * Initializes the CSS3D Renderer
   */
  initCSS3DRenderer(){
    this.css3DRenderer = new CSS3DRenderer();
    this.css3DRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.container.appendChild(this.css3DRenderer.domElement);
  }

  /**
   * Initializes the WebContent by iterating through the children of the WebGL Scene and instantiating a new ThreeWebsiteCanvas
   * for each object with a userData.canvasId property
   */
  initWebContent(){
    for(const child of this.webGLScene.children){
     if(child.userData && child.userData.canvasId && child.name !== CONFIG_CANVAS_NAME){
       const css3DObject = this.getObjectByUserDataProperty(this.css3DScene, "canvasId", child.userData.canvasId);
       this.css3DScene.remove(css3DObject);
       const websiteCanvas = new ThreeWebsiteCanvas(child.userData.res.x, child.userData.res.y, css3DObject.userData.url, child, css3DObject);
       websiteCanvas.addToScenes(this.webGLScene, this.css3DScene);
     }
    }
  }

  /**
   * Initializes the THREE.ConfigCanvas in a scene
   */
  initConfigCanvas(){
    this.configCanvas = new ThreeConfigCanvas(1024, 768, this.perspCamera, this.togglePointerEvents);
    this.configCanvas.addToScenes(this.webGLScene, this.css3DScene);
    this.configCanvas.setPosition(-1, 1, 0);
    this.configCanvas.setRotationQuaternion(new THREE.Quaternion());
    this.configCanvas.setSize(0.3, 0.25);
  }

  /**
   * Deserializes the object string
   * Depending on the userData.url property it searches for the object in either the WebGL or the CSS3D scene
   * When found it updates the scene objects position, rotation and scale, with the values from the given object
   *
   * @param object3DString {String}
   */
  updateObject3D(object3DString){
    const loader = new THREE.ObjectLoader();
    const object3D = loader.parse(JSON.parse(object3DString));
    let scene = this.webGLScene;
    if(object3D.userData.url){
      scene = this.css3DScene;
    }
    const objectInScene = scene.getObjectByProperty("uuid", object3D.uuid);
    if(objectInScene){
      objectInScene.position.copy(object3D.position);
      objectInScene.rotation.copy(object3D.rotation);
      objectInScene.scale.copy(object3D.scale);
    }
  }

  /**
   * Recursively goes through the given scene and searches for an object that has the given value in the given property inside its userData property
   * @param scene {THREE.Scene}
   * @param property {String} name of the property you want to search for
   * @param value {String} value of the property you want to search for
   * @returns {undefined|any}
   */
  getObjectByUserDataProperty(scene, property, value){
    for(const child of scene.children){
      if(child.userData[property] && child.userData[property] === value){
        return child
      }
    }
    return undefined;
  }

  /**
   * creates a new ThreeWebsiteCanvas with the given url ate a fixed location
   * @param url {String}
   */
  spawnWebContent(url){
    // let url = 'https://threejs.org/'; // 'http://localhost:8080'; // 'https://threejs.org/examples/?q=css#css3d_youtube';
    const webContent = new ThreeWebsiteCanvas(
      1024,
      768,
      url,
    );
    webContent.addToScenes(this.webGLScene, this.css3DScene);
    webContent.setPosition(-1, 1, -1);
    webContent.setRotationQuaternion(new THREE.Quaternion());
    webContent.setSize(1, 0.75);
  }

  /**
   * Sets the "pointe-events" style of the webGLRenderer DOM element to either "none" or "all"
   */
  togglePointerEvents(){
    const current = this.webGLRenderer.domElement.style.pointerEvents;
    this.webGLRenderer.domElement.style.pointerEvents = current === "none" && current.length > 0 ? "all": "none";
  }

  /**
   * Toggles the configCanvas of the scene and toggles the pointer events
   * @param websiteCanvas
   */
  toggleConfigCanvas(websiteCanvas){
    this.controls.enabled = !this.controls.enabled;
    this.configCanvas.toggle(websiteCanvas);
    this.togglePointerEvents();
  }

  /**
   * update function that gets executed on every render
   * @param delta
   */
  update(delta) {
  }

  /**
   * downloads both scenes as JSON files
   */
  downloadScenes(){
    const exportName = "sceneJSONDownload";
    const webGLDataURL = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.webGLScene.toJSON()));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", webGLDataURL);
    downloadAnchorNode.setAttribute("download", exportName + "WebGL.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    const css3DDataURL = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.css3DScene.toJSON()));
    downloadAnchorNode.setAttribute("href", css3DDataURL);
    downloadAnchorNode.setAttribute("download", exportName + "CSS3D.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export default XRHub;
