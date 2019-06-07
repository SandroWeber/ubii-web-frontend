<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
import SAVRScene from "./SAVRScene";

// Rendering
/* eslint-disable-next-line no-unused-vars */
import * as THREE from "three";
import SmartphoneCursor from "./modules/SmartphoneCursor";
import VirtualKeyboard from "./modules/VirtualKeyboard";

// Networking
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";
import UbiiClientContent from "../sharedModules/UbiiClientContent";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";
import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";
import { unsubscribe, subscribe } from "./modules/ubiiHelper";

export default {
  name: "SAVRKeyboard",
  extends: SAVRScene,
  components: { UbiiClientContent },

  data: function() {
    return {
      client: undefined,
      oldClients: [],
      text: undefined,
      textMesh: undefined,
      font: undefined,
      cursor: undefined,
      keyboard: undefined
    };
  },

  methods: {
    onStart: function() {
      const ctx = this;

      // setup text
      new THREE.FontLoader().load(
        "fonts/typeface/helvetiker_regular.typeface.json",
        function(font) {
          ctx.font = font;

          const mesh = (ctx.textMesh = new THREE.Mesh(
            new THREE.Geometry(),
            new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
          ));
          mesh.position.set(-3, 4, -10);
          mesh.scale.set(0.1, 0.1, 0.1);
          ctx.scene.add(mesh);

          ctx.text = ">_";
        }
      );

      // setup keyboard
      const area = new THREE.Vector2(20, 15);
      const keyboard = (this.keyboard = new VirtualKeyboard(area));
      keyboard.position.set(-5, 3, -9);
      this.scene.add(keyboard);

      // setup cursor
      const cursor = (this.cursor = new SmartphoneCursor(
        area,
        keyboard.onPress
      ));
      cursor.position.set(-5, 3, -9);
      this.scene.add(cursor);

      // gui
      this.gui.add(cursor, "SELECT_TIME");
      this.gui.add(cursor, "MAX_VELOCITY");
    },
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(delta) {
      this.cursor.render(delta);
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
      const touchEventTopic = id + "/web-interface-smart-device/touch_events";
      const touchPositionTopic =
        id + "/web-interface-smart-device/touch_position";

      this.client = {
        id: id,
        sessions: [],
        topics: [touchEventTopic, touchPositionTopic]
      };

      subscribe(touchEventTopic, event => {
        this.cursor.touched =
          event.type == ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN;

        if (event.position) {
          this.cursor.cursorPosition = new THREE.Vector2(
            event.position.x,
            event.position.y
          );
        }
      });

      subscribe(touchPositionTopic, position => {
        this.cursor.cursorPosition = new THREE.Vector2(position.x, position.y);
      });

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
    onExit: function() {
      if (this.client) {
        unsubscribe(this.client.topics, this.client.sessions);
      }
    }
  },
  watch: {
    text: function(newValue) {
      this.updateText(newValue);
    }
  }
};
</script>
