<template>
    <div id="graph-view">
        <div id="example-threejs-render-container" class="render-container"></div>
    </div>
</template>

<script>
  import * as THREE from 'three';
  const OrbitControls = require('three-orbit-controls')(THREE);

  export default {
    name: 'GraphView',
    props: {
      session: {
        type: Object,
        required: true
      },
    },
    data: () => {
      return {
        camera: null,
        scene: null,
        renderer: null,
        mesh: [],
        controls: null
      };
    },
    watch: {
      session: function(newVal, oldVal) {
        console.log(newVal, oldVal);
        this.addNodes(newVal.interactions);
      }
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


        this.addNodes(this.session.interactions);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
      addNodes: function(interactions) {
        for(let [index, interaction] of interactions.entries()) {
          let geometry = new THREE.SphereGeometry(0.2, 12, 12);
          let material = new THREE.MeshBasicMaterial({color: 0x0033cc, wireframe: true});
          let mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(-2+index, 0, 0);

          this.mesh.push(mesh);
          this.scene.add(mesh);
        }
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

<style scoped>
    #graph-view {
        height: 100%;
        overflow: hidden;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    .render-container {
        height: 100%;
    }
</style>