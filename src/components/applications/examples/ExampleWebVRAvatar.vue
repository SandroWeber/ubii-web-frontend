<template>
  <div>
    <div id="example-threejs-webvr-render-container" class="render-container"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import * as Three from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

export default {
  name: 'ExampleWebVRAvatar',
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      mesh: null,
      cube: null,
      loader: null
    };
  },
  methods: {
    init: async function() {
      let container = document.getElementById(
        'example-threejs-webvr-render-container'
      );

      this.scene = new Three.Scene();
      this.scene.background = new Three.Color(0xFFFFFF);

      this.camera = new Three.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
      );
      this.camera.position.z = 2;
      this.scene.add(this.camera);
      
      const directionalLight = new Three.DirectionalLight( 0x404040, 0.5 );
      this.scene.add( directionalLight );
	
      

      let geometry = new Three.BoxGeometry(0.2, 0.2, 0.2);
      let material = new Three.MeshNormalMaterial();

      this.cube = new Three.Mesh(geometry, material);
      //this.scene.add(this.cube);

      // Add ground plane
      let groundGeometry = new Three.PlaneGeometry(1 , 1, 3);
      let groundMat = new Three.MeshNormalMaterial({color: 0x84c011, side: Three.DoubleSide});
      let ground = new Three.Mesh(groundGeometry, groundMat);
      ground.rotation.x = -Math.PI / 2.1;
      ground.position.y -= 0.25;
      this.scene.add(ground);

      this.renderer = new Three.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.renderer.outputEncoding = Three.sRGBEncoding;
      this.renderer.xr.enabled = true;

      //let context = this.renderer.domElement.getContext('webgl');
      //await context.makeXRCompatible();

      container.appendChild(this.renderer.domElement);

      container.appendChild(VRButton.createButton(this.renderer));


      this.loader = new ColladaLoader();

      this.loader.load('./models/avatar.dae', avatar => {
        this.scene.add(avatar.scene);
      });
    },
    animate: function() {
      const renderer = this.renderer;
      const scene = this.scene;
      const camera = this.camera;
      const cube = this.cube

      this.renderer.setAnimationLoop(function() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.02;
        renderer.render(scene, camera);
      });
    },
    stop: function() {
      this.renderer.setAnimationLoop(null);
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
