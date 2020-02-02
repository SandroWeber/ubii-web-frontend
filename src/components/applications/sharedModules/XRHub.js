import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import ThreeWebContentCanvas from './ThreeWebContentCanvas';

class XRHub {
  constructor(container, camera) {
    this.container = container;
    this.perspCamera = camera;
    this.initVRScene();
    this.initWebContentScene();
    
    this.raycaster = new THREE.Raycaster();
    this.handleMouse = this.handleMouse.bind(this);
    this.container.addEventListener('click', this.handleMouse);
    this.container.addEventListener('mousemove', this.handleMouse);
    this.container.addEventListener('contextmenu', this.handleMouse);
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

    let url = 'http://localhost:8080' // 'https://threejs.org/'; // 'https://threejs.org/examples/?q=css#css3d_youtube';
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

  handleMouse(event) {
    const eventXPosFromCenter = ((event.x-this.container.offsetLeft)/this.container.clientWidth)*2-1;
    const eventYPosFromCenter = ((event.y-this.container.offsetTop)/this.container.clientHeight)*2-1;
    const positionRelativeToContainer = new THREE.Vector3(eventXPosFromCenter, eventYPosFromCenter, 0);
    this.raycaster.setFromCamera(positionRelativeToContainer, this.perspCamera);
    const intersectedObjects = this.raycaster.intersectObjects(
      this.webGLScene.children
    );
    if (intersectedObjects.length) {
      const closestIntersection = intersectedObjects[0];
      if (closestIntersection.object.name === 'threejsorg') {
        const localIntersection = closestIntersection.object.worldToLocal(closestIntersection.point);
        const clientX = (localIntersection.x+0.5)*closestIntersection.object.custom.res.x;
        const clientY = (localIntersection.y+0.5)*closestIntersection.object.custom.res.y;
        const mouseEvent = new MouseEvent(event.type, {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY
        });
        const domElement = closestIntersection.object.custom.website.contentWindow.document.elementFromPoint(clientX, clientY);
        if(domElement){
          domElement.dispatchEvent(mouseEvent);
        }
      }
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
}

export default XRHub;
