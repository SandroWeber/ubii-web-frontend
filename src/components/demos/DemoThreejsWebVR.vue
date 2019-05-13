<template>
  <div class="full-height">
    <div v-show="!ubiiClientService.isConnected">
        <span class="notification">Please connect to backend before starting the application.</span>
    </div>

    <div v-show="ubiiClientService.isConnected" class="full-height">
      <div id="demo-threejs-webvr-render-container" class="full-height"></div>
    </div>
  </div>
</template>

<script>
  /* eslint-disable */ 

  // Rendering
  import * as THREE from 'three'
  import WEBVR from './moduleThreejsWebVR'

  // Networking
  import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';
  import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';


  let ENABLE_VR = false;

  export default {
    name: 'DemoTHREEjsWebVR',
    mounted() {
      this.init();
      this.animate();
      this.subscribe();
    },
    beforeDestroy: function () {
      this.stopDemo();
    },
    data() {
      return {
        camera: null,
        scene: null,
        renderer: null,
        mesh: null,
        ubiiClientService: UbiiClientService,
        clients: new Map(),
        pollSmartDevices: false
      }
    },
    methods: {
      init: function() {
        let container = document.getElementById('demo-threejs-webvr-render-container');

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(70, container.clientWidth/container.clientHeight, 0.01, 10);
        this.camera.position.z = 1;
        this.scene.add(this.camera);

        let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        let material = new THREE.MeshNormalMaterial();

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        if (ENABLE_VR)
        {
          container.appendChild( WEBVR.createButton( this.renderer ) );
          this.renderer.vr.enabled = true;
        }
      },
      animate: function() {
        let renderer = this.renderer;
        let scene = this.scene;
        let camera = this.camera;
        let mesh = this.mesh;
        let clients = this.clients;

        renderer.setAnimationLoop( function () {

          clients.forEach((client, key, map) => {

 
            if (typeof client.orientation.x !== 'undefined') {
              mesh.rotation.x = THREE.Math.degToRad(client.orientation.y);
              mesh.rotation.y = THREE.Math.degToRad(client.orientation.x);
              mesh.rotation.z = THREE.Math.degToRad(-client.orientation.z);
            }
            
            
          });

          renderer.render(scene, camera);
        });
      },
      subscribe: function() {
        window.addEventListener('beforeunload', () => { // unsubscribe before page is unloaded
          this.stopDemo();
        });

        this.startDemo();
      },
      startDemo: function () {
        this.$data.pollSmartDevices = true;
        this.updateSmartDevices();
      },
      stopDemo: function () {
        this.$data.pollSmartDevices = false;
      },
      updateSmartDevices: function () {
        UbiiClientService.client.callService({topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST})
          .then((reply) => {
            this.$data.topicList = reply.stringList.list;

            this.$data.topicList.forEach((topic) => {
              let smart_device_topic_index = topic.indexOf('/web-interface-smart-device/orientation');
              if (smart_device_topic_index !== -1) {
                let clientID = topic.substring(0, smart_device_topic_index);

                if (!this.$data.clients.has(clientID)) {
                  this.addClient(clientID, topic);
                }
              }
            })
          });

        if (this.$data.pollSmartDevices) {
          setTimeout(this.updateSmartDevices, 1000);
        }
      },
      addClient: function(clientID, topic) {
        // create client object with necessary info
        let client = {
          topicOrientation: topic,
          orientation: {x: undefined, y: undefined, z: undefined}
        };
        this.$data.clients.set(clientID, client);

        UbiiClientService.client.subscribe(
          client.topicOrientation,
          (orientation) => {
            client.orientation = orientation;
          }
        );
      }
    },
  }
</script>

<style scoped lang="stylus">
  .full-height
    height: 100%
</style>
