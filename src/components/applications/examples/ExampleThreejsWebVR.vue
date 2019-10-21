<template>
  <div>
    <div id="example-threejs-webvr-render-container" class="render-container"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import * as Three from 'three';
import WebVR from '../sharedModules/WebVR';

export default {
  name: 'ExampleTHREEjsWebVR',
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
      let container = document.getElementById(
        'example-threejs-webvr-render-container'
      );

      this.scene = new Three.Scene();

      this.camera = new Three.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        10
      );
      this.camera.position.z = 1;
      this.scene.add(this.camera);

      let geometry = new Three.BoxGeometry(0.2, 0.2, 0.2);
      let material = new Three.MeshNormalMaterial();

      this.mesh = new Three.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.renderer = new Three.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);

      container.appendChild(WebVR.createButton(this.renderer));
      this.renderer.vr.enabled = true;
    },
    animate: function() {
      const renderer = this.renderer;
      const scene = this.scene;
      const camera = this.camera;
      const mesh = this.mesh;

      this.renderer.setAnimationLoop(function() {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;
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
