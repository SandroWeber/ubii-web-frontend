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
// Rendering
import * as THREE from "three";
import OBJLoader2 from "../sharedModules/OBJLoader2";
import MTLLoader from "../sharedModules/MTLLoader";
import WebVR from "../sharedModules/WebVR";
import DefaultScene from "./modules/DefaultScene";

// Networking
import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";

export default {
  name: "SAVRModelInspector",

  mounted() {
    this.init();
    this.loadResources(); // runs async
    this.connect();
    this.startGameLoop();
  },

  data() {
    return {
      defaultScene: undefined,
      camera: undefined,
      renderer: undefined,
      modelPrefab: undefined,
      time: 0,
      clock: new THREE.Clock(),
      ubiiClientService: UbiiClientService,
      clients: new Map(),
      pollSmartDevices: false
    };
  },

  beforeDestroy: function() {
    this.stopPolling();
  },

  methods: {
    init: function() {
      let container = document.getElementById(
        "savr-model-inspector-render-container"
      );

      this.scene = new THREE.Scene();

      // setup default scene
      this.defaultScene = new DefaultScene(
        this.scene,
        container.clientWidth / container.clientHeight
      );
      this.camera = this.defaultScene.camera;

      // finialize: create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoClear: false
      });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);

      container.appendChild(WebVR.createButton(this.renderer));
      this.renderer.vr.enabled = true;
    },

    // load resources asynchronously
    loadResources: function() {
      let ctx = this;

      // load skeleton model and materials
      new MTLLoader().load("models/skeleton.mtl", function(materials) {
        materials.preload();

        let objLoader = new OBJLoader2();
        objLoader.setLogging(false, false);
        objLoader.setMaterials(materials);
        objLoader.load("models/skeleton.obj", function(event) {
          ctx.modelPrefab = event.detail.loaderRootNode;
        });
      });
    },

    // handles initialization of and in the render loop
    startGameLoop: function() {
      let ctx = this;

      this.renderer.setAnimationLoop(function() {
        let delta = ctx.clock.getDelta();
        ctx.time += delta;

        ctx.gameLoop(delta);

        ctx.renderer.clear();
        ctx.renderer.render(ctx.scene, ctx.camera);
      });
    },

    // this is the main game loop
    /* eslint-disable-next-line no-unused-vars */
    gameLoop: function(deltaTime) {
      this.clients.forEach(client => {
        if (client.orientation && client.model) {
          client.model.rotation.x = THREE.Math.degToRad(client.orientation.y);
          client.model.rotation.y = THREE.Math.degToRad(client.orientation.x);
          client.model.rotation.z = THREE.Math.degToRad(-client.orientation.z);
        }
      });
    },

    connect: function() {
      window.addEventListener("beforeunload", () => {
        this.stopPolling(); // unsubscribe before page is unloaded
      });

      this.pollSmartDevices = true;
      UbiiClientService.isConnected().then(() => {
        this.updateSmartDevices();
      });
    },

    stopPolling: function() {
      this.pollSmartDevices = false;
    },

    updateSmartDevices: function() {
      UbiiClientService.client
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            let topicIndex = topic.indexOf(
              "/web-interface-smart-device/orientation"
            );

            if (topicIndex !== -1) {
              let clientID = topic.substring(0, topicIndex);

              if (!this.$data.clients.has(clientID)) {
                this.addClient(clientID, topic);
              }
            }
          });
        });

      if (this.pollSmartDevices) {
        setTimeout(this.updateSmartDevices, 1000);
      }
    },

    addClient: function(clientID, topic) {
      // client object
      let client = {
        topicOrientation: topic,
        orientation: null,
        model: null
      };

      // check if model loaded
      let ctx = this;
      var checkForPrefab = () => {
        if (this.modelPrefab) {
          client.model = ctx.createClientModel(client);
        } else {
          setTimeout(checkForPrefab, 250);
        }
      };
      checkForPrefab();

      // create the client
      this.clients.set(clientID, client);

      // subscribe the topic
      UbiiClientService.client.subscribe(
        client.topicOrientation,
        orientation => {
          client.orientation = orientation;
        }
      );
    },

    createClientModel: function() {
      let model = this.modelPrefab.clone();

      let pivotPoint = new THREE.Object3D();
      pivotPoint.add(model);
      //model.position.set(new THREE.Vector3(0, -1, 0));
      model.position.set(0, -0.5, 0);

      let radius = 0.75;
      let height = 1.8;
      let rotationOffset = 45 * (this.clients.size - 1);
      let radians = THREE.Math.degToRad(180 - rotationOffset);

      // position client objects on a circle
      pivotPoint.position.set(
        radius * Math.sin(radians),
        height,
        radius * Math.cos(radians)
      );

      this.scene.add(pivotPoint);
      return pivotPoint;
    }
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
