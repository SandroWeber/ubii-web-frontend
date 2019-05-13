<template>
  <div>
    <div id="savr-model-inspector-render-container" class="render-container"></div>
  </div>
</template>

<script>
  /* eslint-disable no-console */

  import * as THREE from 'three'
  import WEBVR from '../sharedModules/moduleThreejsWebVR'
  import SKY from '../sharedModules/moduleThreejsSky'

  export default {
    name: 'SAVRModelInspector',
    data() {
      return {
        camera: null,
        scene: null,
        renderer: null,
        mesh: null,
        time: 0,
        clock: new THREE.Clock(),
      }
    },
    methods: {
      init: function() {
        let container = document.getElementById('savr-model-inspector-render-container');

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(70, container.clientWidth/container.clientHeight, 0.01, 100);
        this.camera.position.z = 1;
        this.scene.add(this.camera);

        let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        let material = new THREE.MeshNormalMaterial();

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        let sky = new SKY();
        this.scene.add(sky);

        let helper = new THREE.GridHelper(10, 10, 0xf7f7f7, 0xc4c4c4);
				this.scene.add(helper);


        // finialize
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        this.renderer.autoClear = false;

        container.appendChild(WEBVR.createButton(this.renderer));
        this.renderer.vr.enabled = true;
      },
      animate: function() {

        let renderer = this.renderer;
        let scene = this.scene;
        let camera = this.camera;
        let mesh = this.mesh;
        let time = this.time;
        let clock = this.clock;

        this.renderer.setAnimationLoop( function () {
          let delta = clock.getDelta();

          mesh.rotation.x += 0.01;
          mesh.rotation.y += 0.02;
          
          time += delta;

          renderer.clear();
          renderer.render(scene, camera);

        });
      },
    },
    mounted() {
      this.init();
      this.animate();
    }
  }
</script>

<style scoped lang="stylus">
  .render-container
    height: 100%
</style>
