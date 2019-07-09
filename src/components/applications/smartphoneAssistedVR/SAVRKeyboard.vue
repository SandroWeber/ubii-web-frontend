<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
/* eslint-disable no-console */
import SAVRScene from './SAVRScene';

// Rendering
/* eslint-disable-next-line no-unused-vars */
import * as THREE from 'three';
import SmartphoneCursor from './modules/SmartphoneCursor';
import VirtualKeyboard from './modules/VirtualKeyboard';
import TextDisplay from './modules/TextDisplay';

// Networking
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService';
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
      textDisplay: undefined,
      taskStarted: false,
      correctionCount: 0,
      startTime: 0,
      //targetString: 'asd'
      targetString: 'The quick brown fox jumps over the lazy dog!'
    };
  },

  methods: {
    onStart: function() {
      const ctx = this;
      var txt = new TextDisplay(new THREE.Vector2(8.5, 2.5), 25, '#FFFFFF');
      txt.position.set(0, 3.5, -7);
      txt.text = this.targetString;
      this.scene.add(txt);

      // setup text display
      this.textDisplay = new TextDisplay(new THREE.Vector2(8.5, 2.5), 25);
      this.textDisplay.position.set(0, 3, -7);
      this.scene.add(this.textDisplay);

      // setup keyboard and cursor
      const keyboardCursorGroup = new THREE.Group();
      const keyboardArea = new THREE.Vector2(5, 2);

      // setup keyboard
      this.keyboard = new VirtualKeyboard(keyboardArea, 12, event => {
        switch (event.action) {
          case VirtualKeyboard.KEY_ACTIONS.DELETE_ONE:
            if (ctx.taskStarted) ctx.correctionCount++;
            ctx.text = ctx.text.substring(0, ctx.text.length - 1);
            break;
          case VirtualKeyboard.KEY_ACTIONS.CLEAR:
          case VirtualKeyboard.KEY_ACTIONS.RETURN:
            if (ctx.taskStarted) {
              const id =
                'savr_vk_' +
                Math.random()
                  .toString(36)
                  .substring(7);

              ctx.taskStarted = false;
              console.log(ctx.correctionCount);
              ctx.generateFile({
                id: id,
                correctionCount: ctx.correctionCount,
                type: 'vk', // model viewer
                time: new Date(),
                timeTaken: new Date() - ctx.startTime
              });

              ctx.text = '';
            }
            if (!ctx.taskStarted) ctx.text = '';
            break;
          case VirtualKeyboard.KEY_ACTIONS.NONE:
          case undefined:
          default:
            ctx.text += event.key;
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

      var guiProp = {
        startTask: function() {
          if (ctx.taskStarted) {
            return;
          }
          console.log('started');

          ctx.taskStarted = true;
          ctx.correctionCount = 0;
          ctx.startTime = new Date();
          ctx.text = '';
        }
      };

      this.gui.add(guiProp, 'startTask');
    },

    generateFile: function(data) {
      var dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(data));
      var downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', data.id + '.json');
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
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
