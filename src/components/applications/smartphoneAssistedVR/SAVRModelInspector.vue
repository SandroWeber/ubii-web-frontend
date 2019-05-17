<template>
  <div class="full-height">
    <div v-show="!ubiiClientService.isConnected">
      <span class="notification">Please connect to backend before starting the application.</span>
    </div>

    <div v-show="ubiiClientService.isConnected" class="full-height">
      <div id="savr-model-inspector-render-container" class="full-height"></div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */

// Rendering
import * as THREE from "three";
import OBJLoader2 from "../sharedModules/OBJLoader2";
import MTLLoader from "../sharedModules/MTLLoader";
import WebVR from "../sharedModules/WebVR";
import Sky from "../sharedModules/Sky";

// Networking
import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";

export default {
  name: "SAVRModelInspector",

  mounted() {
    this.init();
    this.subscribe();
    this.startRenderLoop();
  },

  beforeDestroy: function() {
    this.stopDemo();
  },

  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      model: null,
      time: 0,
      clock: new THREE.Clock(),
      ubiiClientService: UbiiClientService,
      clients: new Map(),
      pollSmartDevices: false
    };
  },

  methods: {
    init: function() {
      let container = document.getElementById(
        "savr-model-inspector-render-container"
      );

      let scene = new THREE.Scene();
      this.scene = scene;

      let camera = new THREE.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        100
      );
      this.camera = camera;
      camera.position.z = 1;
      scene.add(camera);

      let ambient = new THREE.AmbientLight(0x444444);
      scene.add(ambient);

      let directionalLight = new THREE.DirectionalLight(0xffeedd);
      directionalLight.position.set(0, 0, 1).normalize();
      scene.add(directionalLight);

      let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      hemiLight.color.setHSL(0.6, 1, 0.6);
      hemiLight.groundColor.setHSL(0.095, 1, 0.75);
      hemiLight.position.set(0, 500, 0);
      scene.add(hemiLight);

      scene.fog = new THREE.Fog( 0x23272a, 0.5, 1700, 4000 );

      let sky = new Sky();
      scene.add(sky);

      var geometry = new THREE.CylinderGeometry( 0.3, 0.3, 0.05, 32 );
      var material = new THREE.MeshBasicMaterial({color: 0x808080});
      scene.add(new THREE.Mesh(geometry, material));

      scene.add(new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0.06, 0 ), 0.3, 0x4262f4));
      scene.add(new THREE.ArrowHelper(new THREE.Vector3( 1, 0, 0 ), new THREE.Vector3( 0, 0.06, 0 ), 0.3, 0xdb3e00));

      let helper = new THREE.GridHelper(10, 10, 0xf7f7f7, 0xc4c4c4);
      scene.add(helper);

      // finialize
      let renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoClear: false
      });
      this.renderer = renderer;
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      container.appendChild(WebVR.createButton(renderer));
      renderer.vr.enabled = true;
    },

    startRenderLoop: function() {
      let renderer = this.renderer;
      let scene = this.scene;
      let camera = this.camera;
      // eslint-disable-next-line
      let time = this.time;
      let clock = this.clock;
      let clients = this.clients;

      this.renderer.setAnimationLoop(function() {
        let delta = clock.getDelta();
        time += delta;

        clients.forEach(client => {
          if (client.orientation && client.model) {
            client.model.rotation.x = THREE.Math.degToRad(client.orientation.y);
            client.model.rotation.y = THREE.Math.degToRad(client.orientation.x);
            client.model.rotation.z = THREE.Math.degToRad(
              -client.orientation.z
            );
          }
        });

        renderer.clear();
        renderer.render(scene, camera);
      });
    },

    subscribe: function() {
      window.addEventListener("beforeunload", () => {
        this.stopDemo(); // unsubscribe before page is unloaded
      });

      this.startDemo();
    },

    startDemo: function() {
      this.$data.pollSmartDevices = true;
      UbiiClientService.isConnected().then(() => {
        this.updateSmartDevices();
      });
    },

    stopDemo: function() {
      this.$data.pollSmartDevices = false;
    },

    updateSmartDevices: function() {
      UbiiClientService.client
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            let smart_device_topic_index = topic.indexOf(
              "/web-interface-smart-device/orientation"
            );

            if (smart_device_topic_index !== -1) {
              let clientID = topic.substring(0, smart_device_topic_index);

              if (!this.$data.clients.has(clientID)) {
                this.addClient(clientID, topic);
              }
            }
          });
        });

      if (this.$data.pollSmartDevices) {
        setTimeout(this.updateSmartDevices, 1000);
      }
    },

    addClient: function(clientID, topic) {
      let clients = this.clients;
      // client object
      let client = {
        topicOrientation: topic,
        orientation: null,
        model: null,
        rotationOffset: 0
      };

      // TODO: move this to another method
      // TODO: cache model, or does the loader do this by default?
      let mtlLoader = new MTLLoader();
      let scene = this.scene;
      mtlLoader.load("models/skeleton.mtl", function(materials) {
        materials.preload();

        var objLoader = new OBJLoader2();
        objLoader.setLogging(false, false);
        objLoader.setMaterials(materials);
        objLoader.load("models/skeleton.obj", function(event) {
          let model = event.detail.loaderRootNode;

         
          let pivotPoint = new THREE.Object3D();
          pivotPoint.add(model);
           //model.position.set(new THREE.Vector3(0, -1, 0));
          model.position.set(0, -0.5, 0);

          let radius = 0.75;
          let height = 1.8;
          client.rotationOffset = 45 * (clients.size - 1);
          let radians = THREE.Math.degToRad(180 - rotationOffset);

          // position client objects on a circle
          pivotPoint.position.set(
            radius * Math.sin(radians),
            height,
            radius * Math.cos(radians)
          );

          
          scene.add(pivotPoint);
          client.model = pivotPoint;
          console.log("added model")
        });
      });

      this.$data.clients.set(clientID, client);

      UbiiClientService.client.subscribe(
        client.topicOrientation,
        orientation => {
          client.orientation = orientation;
        }
      );
    }
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
