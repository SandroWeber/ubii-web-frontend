<template>
  <div>
    <div id="xrhub-render-container" class="render-container"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import * as THREE from 'three';

import XRHub from '../sharedModules/XRHub';
import FirstPersonControls from '../sharedModules/FirstPersonControls';

export default {
  name: 'XR-Hub',
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      mesh: null
    };
  },
  methods: {
    init: function() {
      this.container = document.getElementById('xrhub-render-container');

      this.xrHub = new XRHub(this.container);
      this.scene = this.xrHub.scene;

      this.camera = new THREE.PerspectiveCamera(
        70,
        this.container.clientWidth / this.container.clientHeight,
        0.01,
        10
      );
      this.camera.position.y = 1;
      this.camera.position.z = 1;
      this.scene.add(this.camera);

      this.controls = new FirstPersonControls(this.camera, this.container);

      let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      let material = new THREE.MeshNormalMaterial();

      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
      this.container.appendChild(this.renderer.domElement);

      let webpage = XRHub.createWebCanvas(
        'https://threejs.org/examples/?q=css#css3d_youtube',
        2,
        2,
        2,
        0
      );
      //this.scene.add(webpage);
    },
    animate: function() {
      const renderer = this.renderer;
      const scene = this.scene;
      const camera = this.camera;
      const mesh = this.mesh;
      const controls = this.controls;
      const clock = new THREE.Clock();

      this.renderer.setAnimationLoop(function() {
        let delta = clock.getDelta();

        mesh.rotation.x += delta;
        mesh.rotation.y += delta;
        renderer.render(scene, camera);
        controls.update(delta);
      });
    },
    stop: function() {
      this.renderer && this.renderer.setAnimationLoop(null);
    }
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
    window.addEventListener('resize', () => {
      if (this.camera && this.container && this.renderer) {
        this.camera.aspect =
          this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
          this.container.clientWidth,
          this.container.clientHeight
        );
      }

      this.controls && this.controls.handleResize();
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
