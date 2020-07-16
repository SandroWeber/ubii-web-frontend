<template>
  <div>
    <div id="xrhub-render-container" class="render-container"></div>
  </div>
</template>

<script>
import * as THREE from 'three';

import XRHub from '../sharedModules/XRHub';
import FirstPersonControls from '../sharedModules/FirstPersonControls';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export default {
  props: {
    roomId: {
      type: String,
      default: undefined
    }
  },
  name: 'XR-Hub-VR',
  data() {
    return {};
  },
  methods: {
    init: function() {
      this.container = document.getElementById('xrhub-render-container');
      this.camera = new THREE.PerspectiveCamera(
        70,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        10
      );
      this.xrHub = new XRHub(this.container, this.camera, this.$props.roomId);
      this.camera.position.y = 1;
      this.camera.position.z = 1;
      this.xrHub.webGLScene.add(this.camera);
      this.xrHub.css3DScene.add(this.camera);

      this.controls = new FirstPersonControls(this.camera, this.container);

      //this.container.appendChild(WebVR.createButton(this.xrHub.webGLRenderer));
      this.container.appendChild(
        VRButton.createButton(this.xrHub.webGLRenderer)
      );
      this.xrHub.webGLRenderer.xr.enabled = true;
    },
    animate: function() {
      const xrHub = this.xrHub;
      const webGLRenderer = this.xrHub.webGLRenderer;
      const css3DRenderer = this.xrHub.css3DRenderer;

      const webGLScene = this.xrHub.webGLScene;
      const css3DScene = this.xrHub.css3DScene;

      const camera = this.camera;
      const controls = this.controls;
      const clock = new THREE.Clock();

      webGLRenderer.setAnimationLoop(function() {
        let delta = clock.getDelta();
        xrHub.update(delta);
        controls.update(delta);
        webGLRenderer.render(webGLScene, camera);
        css3DRenderer.render(css3DScene, camera);
      });
    },
    stop: function() {
      this.xrHub &&
        this.xrHub.webGLRenderer &&
        this.xrHub.webGLRenderer.setAnimationLoop(null);
    }
  },
  mounted() {
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
    window.addEventListener('resize', () => {
      if (
        this.xrHub.camera &&
        this.xrHub.container &&
        this.xrHub.webGLRenderer
      ) {
        this.xrHub.camera.aspect =
          this.container.clientWidth / this.container.clientHeight;
        this.xrHub.camera.updateProjectionMatrix();

        this.xrHub.webGLRenderer.setSize(
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
