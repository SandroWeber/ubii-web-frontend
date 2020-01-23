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
      let container = document.getElementById('xrhub-render-container');

      this.xrHub = new XRHub();
      this.scene = this.xrHub.scene;

      this.camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        10
      );
      this.camera.position.z = 1;
      this.scene.add(this.camera);

      this.controls = new FirstPersonControls(this.camera, container);

      let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      let material = new THREE.MeshNormalMaterial();

      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);
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
