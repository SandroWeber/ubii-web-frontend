import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { MathUtils } from 'three/src/math/MathUtils';

export default class ModelViewerRendering {
  constructor(containerElement) {
    this.containerElement = containerElement;
    this.selectedObjects = [];
  }

  init() {
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.containerElement.clientWidth / this.containerElement.clientHeight,
      0.001,
      10
    );
    this.camera.position.z = 1.5;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60adfe);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.containerElement.clientWidth,
      this.containerElement.clientHeight
    );
    window.addEventListener('resize', (...params) => {
      this.onWindowResize(...params);
    });
    this.containerElement.appendChild(this.renderer.domElement);

    // light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);

    // post-processing
    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.outlinePass.edgeStrength = 3;
    this.outlinePass.visibleEdgeColor.set('#ffffff');
    this.outlinePass.selectedObjects = this.selectedObjects;
    this.composer.addPass(this.outlinePass);

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms['resolution'].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(this.effectFXAA);

    this.loadModels();

    this.animate();
  }

  animate() {
    if (this.renderer) {
      requestAnimationFrame(() => {
        this.animate();
      });

      this.updateSelectedRotation();
      this.composer.render();
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  selectObject(object) {
    let index = this.selectedObjects.indexOf(object);
    if (index === -1) {
      this.selectedObjects.push(object);
    } else {
      this.selectedObjects.splice(index, 1);
    }
  }

  triggerSelection() {
    console.info('triggerSelection');
    let smartphonePosition = new THREE.Vector3();
    let smartphoneForward = new THREE.Vector3();
    this.objectSmartphone.getWorldPosition(smartphonePosition);
    this.objectSmartphone.getWorldDirection(smartphoneForward);
    const raycaster = new THREE.Raycaster(
      smartphonePosition,
      smartphoneForward,
      0.1,
      100
    );
    const intersects = raycaster
      .intersectObjects(this.scene.children, true)
      .filter(hit => hit.object.type === 'Mesh');
    console.info(intersects);

    if (intersects.length > 0) {
      let object = undefined;
      intersects[0].object.traverseAncestors(ancestor => {
        if (ancestor.parent === this.scene) {
          object = ancestor;
        }
      });
      this.selectObject(object);
    }
  }

  startSelectionRotation() {
    console.info('startSelectionRotation');
    /*this.onSelectionRotationStartInfo = {
      smartphoneRotation: this.objectSmartphone.quaternion.clone()
    }*/

    this.rotateSelected = true;
    this.lastSmartPhoneQuaternion = this.objectSmartphone.quaternion.clone();
  }

  stopSelectionRotation() {
    console.info('stopSelectionRotation');
    this.rotateSelected = false;
  }

  updateSelectedRotation() {
    if (!this.rotateSelected) return;

    let currentSmartPhoneQuaternion = new THREE.Quaternion();
    this.objectSmartphone.getWorldQuaternion(currentSmartPhoneQuaternion);
    let diffSmartphoneQuaternion = this.lastSmartPhoneQuaternion.invert().premultiply(currentSmartPhoneQuaternion);

    this.selectedObjects.forEach(object => {
      object.quaternion.premultiply(diffSmartphoneQuaternion);
    });

    this.lastSmartPhoneQuaternion = currentSmartPhoneQuaternion;
  }

  setSmartphoneRotation(eulerDegX, eulerDegY, eulerDegZ) {
    let smartPhoneQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        MathUtils.degToRad(eulerDegX),
        MathUtils.degToRad(eulerDegY),
        MathUtils.degToRad(eulerDegZ)
      )
    );
    smartPhoneQuaternion.multiply(this.objectSmartphoneInitQuaternion);
    this.objectSmartphone.setRotationFromQuaternion(
      smartPhoneQuaternion.normalize()
    );
    //this.objectSmartphone.setRotationFromQuaternion(new Quaternion(1,1,0,1).normalize());
  }

  loadModels() {
    // materials
    let materialLightgray = new THREE.MeshPhongMaterial({
      color: 'lightgrey',
      specular: 'white',
      shininess: 5,
      transparent: false
    });
    let materialRed = new THREE.MeshPhongMaterial({
      color: 'red',
      specular: 0xff0000,
      shininess: 5,
      transparent: false
    });
    let materialGreen = new THREE.MeshPhongMaterial({
      color: 'green',
      specular: 'white',
      shininess: 5,
      transparent: false
    });

    const manager = new THREE.LoadingManager();
    let loaderOBJ = new OBJLoader(manager);
    // skelly boi
    new MTLLoader(manager).load('models/skeleton.mtl', mtl => {
      mtl.preload();
      new OBJLoader(manager).setMaterials(mtl).load(
        'models/skeleton.obj',
        obj => {
          this.objectSkeleton = obj;
          this.objectSkeleton.name = 'spooky boi';
          this.objectSkeleton.position.set(-0.5, -0.5, 0);
          this.objectSkeleton.traverse(node => {
            if (node.type === 'Mesh') {
              node.material = materialLightgray;
            }
          });
          this.scene.add(this.objectSkeleton);
        },
        null,
        this.onLoaderError
      );
    });
    // kettle boi
    loaderOBJ.load(
      'models/teapot.obj',
      obj => {
        this.objectTeapot1 = obj;
        this.objectTeapot2 = obj.clone();
        this.objectTeapot1.name = 'teapot1';
        this.objectTeapot2.name = 'teapot2';

        this.objectTeapot1.position.set(0, -0.5, -1);
        this.objectTeapot1.scale.set(0.3, 0.3, 0.3);
        this.objectTeapot1.traverse(node => {
          if (node.type === 'Mesh') {
            node.material = materialRed;
          }
        });
        this.scene.add(this.objectTeapot1);

        this.objectTeapot2.position.set(1, 0.5, -1);
        this.objectTeapot2.scale.set(0.1, 0.1, 0.1);
        this.objectTeapot2.traverse(node => {
          if (node.type === 'Mesh') {
            node.material = materialGreen;
          }
        });
        this.scene.add(this.objectTeapot2);
      },
      null,
      this.onLoaderError
    );
    // smart boi
    new MTLLoader(manager).load(
      'models/smartphone.mtl',
      mtl => {
        mtl.preload();
        new OBJLoader(manager).setMaterials(mtl).load(
          'models/smartphone.obj',
          obj => {
            this.objectSmartphone = obj;
            this.objectSmartphone.name = 'smartphone';
            this.objectSmartphone.position.set(0, -0.05, 0.9);
            this.objectSmartphone.rotation.set(Math.PI, 0, 0);
            this.scene.add(this.objectSmartphone);
            this.objectSmartphoneInitQuaternion = this.objectSmartphone.quaternion.clone();
            //const axesHelper = new THREE.AxesHelper(0.5);
            //this.objectSmartphone.add(axesHelper);

            // add raycast visualizer
            const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
            const points = [];
            points.push(new THREE.Vector3(0, 0, 0));
            points.push(new THREE.Vector3(0, 0, 10));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.raycastLineVisualizer = new THREE.Line(geometry, material);
            this.objectSmartphone.add(this.raycastLineVisualizer);
          },
          null,
          this.onLoaderError
        );
      },
      null,
      this.onLoaderError
    );
  }

  onLoaderError(error) {
    console.warn(error);
  }
}
