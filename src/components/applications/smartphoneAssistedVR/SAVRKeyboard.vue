<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
import SAVRScene from './SAVRScene';

// Rendering
/* eslint-disable-next-line no-unused-vars */
import * as THREE from 'three';
import SmartphoneCursor from './modules/SmartphoneCursor';
import VirtualKeyboard from './modules/VirtualKeyboard';
import TextDisplay from './modules/TextDisplay';

// Networking
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import UbiiClientContent from '../sharedModules/UbiiClientContent';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { unsubscribe, subscribe } from './modules/ubiiHelper';

export default {
  name: 'SAVRKeyboard',
  extends: SAVRScene,
  components: { UbiiClientContent },

  data: function() {
    return {
      client: undefined,
      oldClients: [],
      text: '',
      cursor: undefined,
      keyboard: undefined,
      textDisplay: undefined
    };
  },

  methods: {
    onStart: function() {
      // setup text display
      this.textDisplay = new TextDisplay(new THREE.Vector2(7.5, 2.5));
      this.textDisplay.position.set(0, 3, -7);
      this.scene.add(this.textDisplay);

      // setup keyboard and cursor
      const keyboardCursorGroup = new THREE.Group();
      const keyboardArea = new THREE.Vector2(5, 2);

      // setup keyboard
      this.keyboard = new VirtualKeyboard(keyboardArea, 12, event => {
        switch (event.action) {
          case VirtualKeyboard.KEY_ACTIONS.DELETE_ONE:
            this.text = this.text.substring(0, this.text.length - 1);
            break;
          case VirtualKeyboard.KEY_ACTIONS.CLEAR:
          case VirtualKeyboard.KEY_ACTIONS.RETURN:
            this.text += '\n';
            break;
          case VirtualKeyboard.KEY_ACTIONS.NONE:
          case undefined:
          default:
            this.text += event.key;
            break;
        }
      });
      keyboardCursorGroup.add(this.keyboard);

      // setup cursor
      this.cursor = new SmartphoneCursor(keyboardArea, event => {
        this.keyboard.onPress(event);
      });
      this.cursor.position.set(0, 0, 0.15);
      keyboardCursorGroup.add(this.cursor);

      keyboardCursorGroup.position.set(0, 1.1, -6);
      keyboardCursorGroup.rotation.set(-THREE.Math.degToRad(20), 0, 0);
      this.scene.add(keyboardCursorGroup);

      // gui
      this.gui.add(this.cursor, 'SELECT_TIME');
      this.gui.add(this.cursor, 'MAX_VELOCITY');
    },
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(delta) {
      this.cursor.render(delta);
    },
    updateSmartDevices: function() {
      UbiiClientService.instance
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            const topicIndex = topic.indexOf('/web-interface-smart-device/');

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
      const touchEventTopic = id + '/web-interface-smart-device/touch_events';
      const touchPositionTopic =
        id + '/web-interface-smart-device/touch_position';

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
    onDisconnectToUbii: function() {
      if (this.client) {
        unsubscribe(this.client.topics, this.client.sessions);
      }
      this.oldClients = [];
    }
  },
  watch: {
    text: function(newValue) {
      this.textDisplay.text = newValue;
    }
  }
};
</script>
