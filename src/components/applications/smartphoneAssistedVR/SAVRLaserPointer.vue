<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
import UbiiClientContent from "../sharedModules/UbiiClientContent";
import SAVRScene from "./SAVRScene";

// Rendering
/* eslint-disable-next-line no-unused-vars */
import * as THREE from "three";
import { loadObj } from "./modules/threeHelper";
//import { Vector3 } from "three";

// Networking
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";
import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";
import { createUbiiSpecs, subscribe, unsubscribe } from "./modules/ubiiHelper";

export default {
  name: "SAVRLaserPointer",
  extends: SAVRScene,
  components: { UbiiClientContent },

  data() {
    return {
      model: undefined,
      client: undefined,
      oldClients: []
    };
  },

  methods: {
    onStart: function() {
      loadObj("models/smartphone", model => {
        model.scale.set(3, -3, -3);
        this.$data.scene.add(model);
        this.$data.model = model;
      });
    },
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(delta) {
      if (this.model && this.camera) {
        let camPos = this.camera.position;
        let viewDir = new THREE.Vector3(0, 0, -1);
        viewDir.applyQuaternion(this.camera.quaternion);
        viewDir.y = 0;
        this.model.position = new THREE.Vector3(camPos.x, 1.2, camPos.z).add(
          viewDir
        );
      }
      if (this.model && this.client && this.client.orientation) {
        this.model.rotation.x = this.client.orientation.x;
        this.model.rotation.y = this.client.orientation.y;
        this.model.rotation.z = this.client.orientation.z;
      }
    },
    updateSmartDevices: function() {
      UbiiClientService.client
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            const topicIndex = topic.indexOf(
              "/web-interface-smart-device/orientation"
            );

            if (topicIndex !== -1) {
              const clientID = topic.substring(0, topicIndex);

              // create new client if we dont have one yet or a new client just connected

              if (!this.$data.client) {
                this.createClient(clientID, topic);
              } else {
                if (!this.$data.oldClients.includes(clientID)) {
                  this.createClient(clientID, topic);
                }
              }
            }
          });
        });
    },
    createClient: function(id, topic) {
      if (this.client) {
        // unsubscribe old client
        unsubscribe({ session: this.client.session, topic: this.client.topic });
      }

      // subscribe client
      const specs = this.createOrientationSpecs(id, topic);

      this.oldClients.push(id);
      this.client = {
        id: id,
        session: specs.session,
        topic: specs.topic,
        orientation: undefined
      };

      const client = this.client;
      subscribe(specs, orientation => {
        client.orientation = orientation;
      });
    },
    createOrientationSpecs: function(clientID, clientTopic) {
      const deviceName = this.$options.name; // get name property of current view

      const orientationInput = {
        internalName: "orientation",
        messageFormat: "vector3",
        topic: clientTopic // e.g. 08d58eb6-7b51-4bae-908b-b737cde85429/web-interface-smart-device/orientation
      };

      const orientationOutput = {
        internalName: "orientation",
        messageFormat: "vector3",
        topic: clientID + "/" + deviceName + "/orientation"
      };

      /* eslint-disable-next-line */
      const processingCallback = (input, output) => {
        /* eslint-disable */
        if (!input) {
          return;
        }

        const halfPI = Math.PI / 180;
        const deg2Rad = function(x) {
          return x * halfPI;
        };

        output.orientation = {
          x: deg2Rad(input.orientation.y),
          y: deg2Rad(input.orientation.x),
          z: deg2Rad(-input.orientation.z)
        };
      };

      const specs = createUbiiSpecs(
        deviceName,
        [orientationInput],
        [orientationOutput],
        processingCallback
      );

      return {
        session: specs.session,
        interaction: specs.interaction,
        topic: orientationOutput.topic
      };
    },
    onExit: function() {
      unsubscribe({ session: this.client.session, topic: this.client.topic });
    }
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
