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
import {
  createUbiiSpecs,
  subscribeSpecs,
  unsubscribe
} from "./modules/ubiiHelper";

export default {
  name: "SAVRKeyboard",
  extends: SAVRScene,
  components: { UbiiClientContent },

  data() {
    return {
      model: undefined,
      client: undefined,
      oldClients: [],
      text: "Hello World!",
      textMesh: undefined,
      font: undefined
    };
  },

  methods: {
    onStart: function() {
      const ctx = this;

      loadObj("models/smartphone", model => {
        model.scale.set(3, -3, -3);
        ctx.scene.add(model);
        ctx.model = model;
      });

      new THREE.FontLoader().load(
        "fonts/typeface/helvetiker_regular.typeface.json",
        function(font) {
          ctx.font = font;

          const mesh = (ctx.textMesh = new THREE.Mesh(
            new THREE.Geometry(),
            new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
          ));
          mesh.position.set(-3, 2, -10);
          mesh.scale.set(0.1, 0.1, 0.1);
          ctx.scene.add(mesh);

          ctx.text = "[       ...       ]";
        }
      );
    },
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(delta) {
      // calculate model position
      if (this.model && this.camera) {
        const height = 1.2;
        const distance = 0.7;

        const camPos = this.camera.position;
        const viewDir = new THREE.Vector3(0, 0, -1);

        viewDir.applyQuaternion(this.camera.quaternion);
        viewDir.y = 0;
        viewDir.normalize();
        //viewDir.divideScalar(viewDir.lengthSq()); // fast normalize
        viewDir.multiplyScalar(distance);

        this.model.position = new THREE.Vector3(camPos.x, height, camPos.z).add(
          viewDir
        );
      }

      // calculate model rotation
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
            const topicIndex = topic.indexOf("/web-interface-smart-device/");

            if (topicIndex !== -1) {
              const clientID = topic.substring(0, topicIndex);

              // create new client if we dont have one yet or a new client just connected

              if (!this.$data.client) {
                this.createClient(clientID);
              } else {
                if (!this.$data.oldClients.includes(clientID)) {
                  this.createClient(clientID);
                }
              }
            }
          });
        });
    },
    createClient: function(id) {
      if (this.client) {
        // unsubscribe old client
        unsubscribe(this.client.topics, this.client.sessions);
      }

      // create sessions and topics
      const orientationSpecs = this.createOrientationSpecs(id);
      const touchEventTopic = id + "/web-interface-smart-device/touch_events";

      const client = (this.client = {
        id: id,
        sessions: [orientationSpecs.session],
        topics: [orientationSpecs.topic, touchEventTopic],
        orientation: undefined
      });

      // subscribe client
      subscribeSpecs(orientationSpecs, orientation => {
        client.orientation = orientation;
      });

      //const ctx = this;
      //const debugRays = false;
      //subscribe(touchEventTopic, event => {});

      this.oldClients.push(id);
    },
    updateText: function(text) {
      if (!this.font || !this.textMesh) {
        // eslint-disable-next-line no-console
        console.warn("Can't update text, because the font or mesh is null.");
        return;
      }

      let geometry = new THREE.TextGeometry(text, {
        font: this.font,
        size: 10,
        height: 1
      });

      if (this.textMesh.geometry) {
        this.textMesh.geometry.dispose();
      }
      this.textMesh.geometry = geometry;
    },
    createOrientationSpecs: function(clientID) {
      const deviceName = this.$options.name; // get name property of current view

      const orientationInput = {
        internalName: "orientation",
        messageFormat: "vector3",
        topic: clientID + "/web-interface-smart-device/orientation" // e.g. 08d58eb6-7b51-4bae-908b-b737cde85429/web-interface-smart-device/orientation
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
      if (this.client) {
        unsubscribe(this.client.topics, this.client.sessions);
      }
    }
  },
  watch: {
    text: function(newValue, oldValue) {
      this.updateText(newValue);
    }
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
