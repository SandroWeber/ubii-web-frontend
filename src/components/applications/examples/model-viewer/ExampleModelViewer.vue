<template>
  <div>
    <div id="example-threejs-render-container" class="render-container"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

import ModelViewerUbiiConnections from './model-viewer-ubii-connections';

export default {
  name: 'ExampleTHREEjs',
  data() {
    return {};
  },
  methods: {
    init: function() {
      let ubiiConnections = new ModelViewerUbiiConnections();
      ubiiConnections.init();

      let container = document.getElementById(
        'example-threejs-render-container'
      );

      this.camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.001,
        10
      );
      this.camera.position.z = 1;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x60adfe);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 1);
      this.scene.add(directionalLight);

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
            console.info(obj);
            this.objectSkeleton = obj;
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
          console.info(obj);
          this.objectTeapot1 = obj;
          this.objectTeapot2 = obj.clone();

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
              console.info(obj);
              this.objectSmartphone = obj;
              this.objectSmartphone.position.set(0, -0.05, 0.9);
              this.objectSmartphone.rotation.set(Math.PI, 0, 0);
              this.scene.add(this.objectSmartphone);
            },
            null,
            this.onLoaderError
          );
        },
        null,
        this.onLoaderError
      );

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      window.addEventListener('resize', this.onWindowResize);
      container.appendChild(this.renderer.domElement);
    },
    animate: function() {
      if (this.renderer) {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
      }
    },
    stop: function() {
      this.renderer = null;
    },
    onWindowResize: function() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    onLoaderError: function(error) {
      console.warn(error);
    }
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      this.stop();
    });

    this.init();
    this.animate();
  },
  beforeDestroy: function() {
    this.stop();
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
