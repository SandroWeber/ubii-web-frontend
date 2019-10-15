<template>
  <div>
    <div id="example-threejs-render-container" class="render-container"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import * as THREE from 'three';

export default {
  name: 'ExampleTHREEjs',
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
        'example-threejs-render-container'
      );

      this.camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        10
      );
      this.camera.position.z = 1;

      this.scene = new THREE.Scene();

      let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      let material = new THREE.MeshNormalMaterial();

      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);
    },
    animate: function() {
      if (this.renderer) {
        requestAnimationFrame(this.animate);
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.02;
        this.renderer.render(this.scene, this.camera);
      }
    },
    stop: function() {
      this.renderer = null;
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
