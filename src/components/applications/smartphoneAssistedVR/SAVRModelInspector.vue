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
import uuidv4 from "uuid/v4";
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";
import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";

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
    },

    // load resources asynchronously
    loadResources: function() {
      const ctx = this;

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

    // create specifications for the protobuf messages
    createUbiiSpecs: function(clientID, clientTopic) {
      let deviceName = this.$options.name; // get name property of current view

      let orientationInput = {
        internalName: "orientationIn",
        messageFormat: "ubii.dataStructure.Vector3",
        topic: clientTopic
      };

      let orientationOutput = {
        internalName: "orientationOut",
        messageFormat: "ubii.dataStructure.Vector3",
        topic: clientID + "/" + deviceName + "/orientation"
      };

      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: orientationInput.topic,
            messageFormat: orientationInput.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: orientationOutput.topic,
            messageFormat: orientationOutput.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };

      /* eslint-disable-next-line */
      let processingCallback = (input, output) => {
        /* eslint-disable */
        if (!input) {
          return;
        }

        //output.orientation = input.orientation;
        output = input;
        console.log(input);
      };

      let ubiiInteraction = {
        id: uuidv4(),
        name: deviceName,
        processingCallback: processingCallback.toString(),
        inputFormats: [
          {
            internalName: orientationInput.internalName,
            messageFormat: orientationInput.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: orientationOutput.internalName,
            messageFormat: orientationOutput.messageFormat
          }
        ]
      };

      let ubiiSession = {
        id: uuidv4(),
        name: deviceName,
        interactions: [ubiiInteraction],
        ioMappings: [
          {
            interactionId: ubiiInteraction.id,
            interactionInput: {
              internalName: orientationInput.internalName,
              messageFormat: orientationInput.messageFormat
            },
            topic: orientationInput.topic
          },
          {
            interactionId: ubiiInteraction.id,
            interactionOutput: {
              internalName: orientationOutput.internalName,
              messageFormat: orientationOutput.messageFormat
            },
            topic: orientationOutput.topic
          }
        ]
      };

      return {
        device: ubiiDevice,
        session: ubiiSession,
        topic: orientationOutput.topic
      };
    },

    // handles initialization of and in the render loop
    startGameLoop: function() {
      const ctx = this;

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
      const client = {
        orientation: null,
        model: null,
        session: null
      };

      // check if model is loaded
      const ctx = this;
      let checkForPrefab = () => {
        if (this.modelPrefab) {
          client.model = ctx.createClientModel(client);
        } else {
          setTimeout(checkForPrefab, 250);
        }
      };

      let specs = this.createUbiiSpecs(clientID, topic);
      client.session = specs.session;

      UbiiClientService.registerDevice(specs.device)
        .then(device => {
          return device;
        })
        .then(() => {
          // subscribe the topic
          UbiiClientService.client.subscribe(specs.topic, orientation => {
            client.orientation = orientation;
          });

          // start our session (registering not necessary as we do not want to save it permanently)
          UbiiClientService.client
            .callService({
              topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
              session: client.session
            })
            .then(() => {
              checkForPrefab();
            });
        });

      // create the client
      this.clients.set(clientID, client);
    },

    createClientModel: function() {
      let model = this.modelPrefab.clone();

      let pivotPoint = new THREE.Object3D();
      pivotPoint.add(model);
      //model.position.set(new THREE.Vector3(0, -1, 0));
      model.position.set(0, -0.5, 0);

      let radius = 0.75;
      let height = 1.2;
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

.notification {
  color: red;
}
</style>
