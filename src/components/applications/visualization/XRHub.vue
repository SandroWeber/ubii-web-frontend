<template>
  <div>
    <div id="xrhub-render-container" class="render-container"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import * as THREE from 'three';

import XRHub from '../sharedModules/XRHub';

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
    },
    animate: function() {
      const renderer = this.xrHub.renderer;
      const webContentRenderer = this.xrHub.webContentRenderer;

      const scene = this.xrHub.scene;
      const webContentScene = this.xrHub.webContentScene;

      const camera = this.xrHub.camera;
      const mesh = this.xrHub.mesh;
      const controls = this.xrHub.controls;
      const clock = new THREE.Clock();

      renderer.setAnimationLoop(function() {
        let delta = clock.getDelta();

        mesh.rotation.x += delta;
        mesh.rotation.y += delta;
        renderer.render(scene, camera);
        webContentRenderer.render(webContentScene, camera);
        controls.update(delta);
      });
    },
    stop: function() {
      this.xrHub &&
        this.xrHub.renderer &&
        this.xrHub.renderer.setAnimationLoop(null);
    }
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
    window.addEventListener('resize', () => {
      if (this.xrHub.camera && this.xrHub.container && this.xrHub.renderer) {
        this.xrHub.camera.aspect =
          this.container.clientWidth / this.container.clientHeight;
        this.xrHub.camera.updateProjectionMatrix();

        this.xrHub.renderer.setSize(
          this.container.clientWidth,
          this.container.clientHeight
        );
        this.xrHub.webContentRenderer.setSize(
          this.container.clientWidth,
          this.container.clientHeight
        );
      }

      this.xrHub.controls && this.xrHub.controls.handleResize();
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
