<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
// Parent
import UbiiClientContent from "../sharedModules/UbiiClientContent";
import SAVRScene from "./SAVRScene";

// Rendering
import * as THREE from "three";
import OBJLoader2 from "../sharedModules/OBJLoader2";
import MTLLoader from "../sharedModules/MTLLoader";

// Networking
import uuidv4 from "uuid/v4";
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";
import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";

export default {
  name: "SAVRModelInspector",
  extends: SAVRScene,
  components: { UbiiClientContent },

  data() {
    return {
      modelPrefab: undefined
    };
  },

  methods: {
    // load resources asynchronously, called by parent
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
        messageFormat: "vector3",
        topic: clientTopic // e.g. 08d58eb6-7b51-4bae-908b-b737cde85429/web-interface-smart-device/orientation
      };

      let orientationOutput = {
        internalName: "orientationOut",
        messageFormat: "vector3",
        topic: clientID + "/" + deviceName + "/orientation"
      };

      /* eslint-disable-next-line */
      let processingCallback = (input, output) => {
        /* eslint-disable */
        if (!input) {
          return;
        }

        output.orientationOut = input.orientationIn;
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
        session: ubiiSession,
        topic: orientationOutput.topic
      };
    },

    // this is the main game loop, called by parent
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

    // called by parent
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

      // start our session (registering not necessary as we do not want to save it permanently)
      UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
          session: client.session
        })
        .then(() => {
          // subscribe the topic
          UbiiClientService.client
            .subscribe(specs.topic, orientation => {
              client.orientation = orientation;
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
</style>