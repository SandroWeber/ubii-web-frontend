<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div class="grid">
      <div class="seperator app-header">
        <span class="separator-label">Fitts' Law</span>
      </div>
      <div class="app-description">Hit the blue target!</div>

      <div class="app-settings">
        <div>
          <!-- a checkbox to toggle showing the client side pointer -->
          <input id="checkboxClientPointer" type="checkbox" v-model="showClientPointer" />
          <label for="checkboxClientPointer">Show Client Pointer</label>

          <br />

          <!-- a checkbox to toggle showing the server side pointer -->
          <input id="checkboxServerPointer" type="checkbox" v-model="showServerPointer" />
          <label for="checkboxServerPointer">Show Server Pointer</label>

          <br />

          <!-- a checkbox to toggle inverting the pointer position at the server before sending it back to client -->
          <input id="checkboxMirrorPointer" type="checkbox" v-model="mirrorPointer" />
          <label for="checkboxMirrorPointer">Mirror Pointer</label>

          <br />

          <!-- a checkbox to toggle immediate publishing of TopicDataRecords -->
          <input id="checkboxPublishImmediately" type="checkbox" v-model="publishImmediately" />
          <label for="checkboxPublishImmediately">Publish Immediately</label>

          <br />

          <!-- a checkbox to toggle immediate publishing of TopicDataRecords -->
          <input
            id="numberPublishInterval"
            type="number"
            v-model="publishIntervalMs"
            :disabled="publishImmediately"
            v-on:change="onPublishIntervalChange"
          />
          <label for="numberPublishInterval">Publish Interval (ms)</label>
        </div>

        <div>
          <!-- the target width variants -->
          <div>Target Width Variants:</div><div>{{ targetWidthVariants }}</div>
          <!-- the target distance variants -->
          <div>Target Distance Variants:</div><div>{{ targetDistanceVariants }}</div>
        </div>
      </div>

      <!-- the mouse area.
      if our pointer is inside, its position is sent to the server and back to us, then displayed as a red square-->
      <div
        id="mouse-pointer-area"
        class="mouse-pointer-area"
        v-bind:class="{ hideCursor: experimentStarted && !showClientPointer }"
        v-on:mousemove="onMouseMove($event)"
        v-on:mouseenter="clientPointerInside = true"
        v-on:mouseleave="clientPointerInside = false"
        v-on:touchstart="onTouchStart($event)"
        v-on:touchend="clientPointerInside = false"
        v-on:touchmove="onTouchMove($event)"
      >
        <font-awesome-icon
          class="server-mouse-position-indicator"
          icon="mouse-pointer"
          :style="{
            top: serverMousePosition.y - 1 + 'px',
            left: serverMousePosition.x - 1 + 'px'
          }"
          v-show="experimentStarted && showServerPointer && clientPointerInside"
        />

        <button class="button-start" v-show="!experimentStarted" v-on:click="startExperiment()">Start</button>
      </div>
    </div>
  </UbiiClientContent>
</template>

<script>
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiClientContent from '../../sharedModules/UbiiClientContent';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faMousePointer } from '@fortawesome/free-solid-svg-icons';

library.add(faMousePointer);

export default {
  name: 'ExampleMousePointer',
  components: { UbiiClientContent },
  /* STEP 1: mounted() is our vue component entry point, start here! */
  mounted: async function() {
    // unsubscribe before page is suddenly closed
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.initialize();
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.stopExample();
    });
  },
  beforeDestroy: function() {
    this.stopExample();
  },
  data: () => {
    return {
      showClientPointer: false,
      showServerPointer: true,
      mirrorPointer: false,
      publishImmediately: false,
      publishIntervalMs: UbiiClientService.instance.getPublishIntervalMs(),
      ubiiClientService: UbiiClientService.instance,
      initialized: false,
      experimentStarted: false,
      clientMousePosition: { x: 0, y: 0 },
      serverMousePosition: { x: 0, y: 0 },
      clientPointerInside: false,
      targetWidthVariants: [16, 32, 64],
      targetDistanceVariants: [128, 256, 512]
    };
  },
  watch: {
    mirrorPointer: function(value) {
      if (
        !UbiiClientService.instance.isConnected() ||
        !this.ubiiDevice.name ||
        !this.ubiiComponentMirrorPointer.topic
      ) {
        return;
      }

      this.publishMirrorPointer(value);
    }
  },
  methods: {
    initialize: async function() {
      this.publishIntervalMs = UbiiClientService.instance.getPublishIntervalMs();

      this.createUbiiSpecs();

      let replyRegisterDevice = await UbiiClientService.instance.registerDevice(this.ubiiDevice);
      if (replyRegisterDevice.id) {
        this.ubiiDevice = replyRegisterDevice;
      } else {
        console.error(replyRegisterDevice);
      }

      await UbiiClientService.instance.subscribeTopic(
        this.ubiiComponentServerPointer.topic,
        this.subscriptionServerPointerPosition
      );

      let replySessionStart = await UbiiClientService.instance.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
        session: this.ubiiSession
      });
      if (replySessionStart.session) {
        this.ubiiSession = replySessionStart.session;
      }

      this.initialized = true;
    },
    deinitialize: async function() {
      UbiiClientService.instance.setPublishIntervalMs(15);

      await UbiiClientService.instance.unsubscribeTopic(
        this.ubiiComponentServerPointer.topic,
        this.subscriptionServerPointerPosition
      );
      await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.ubiiSession
      });

      if (this.ubiiDevice) {
        await UbiiClientService.instance.deregisterDevice(this.ubiiDevice);
      }

      this.initialized = false;
    },
    createUbiiSpecs: function() {
      let deviceName = 'web-example-mouse-pointer';
      let topicPrefix = '/' + UbiiClientService.instance.getClientID() + '/' + deviceName;

      this.ubiiDevice = {
        clientId: UbiiClientService.instance.getClientID(),
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            name: '2D pointer original',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
            topic: topicPrefix + '/mouse_client_position',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
          {
            name: '2D pointer mirroring around center',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
            topic: topicPrefix + '/mirror_mouse',
            messageFormat: 'bool'
          },
          {
            name: '2D pointer processed',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER,
            topic: topicPrefix + '/mouse_server_position',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      };
      this.ubiiComponentClientPointer = this.ubiiDevice.components[0];
      this.ubiiComponentMirrorPointer = this.ubiiDevice.components[1];
      this.ubiiComponentServerPointer = this.ubiiDevice.components[2];

      let processingCallback = (deltaTime, inputs) => {
        if (!inputs.clientPointer) {
          return {};
        }

        let outputs = {};

        if (inputs.mirrorPointer === true) {
          outputs.serverPointer = {
            x: 1 - inputs.clientPointer.x,
            y: 1 - inputs.clientPointer.y
          };
        } else {
          outputs.serverPointer = {
            x: inputs.clientPointer.x,
            y: inputs.clientPointer.y
          };
        }

        return { outputs };
      };

      this.ubiiProcessingModule = {
        name: 'mirror-mouse-pointer',
        onProcessingStringified: processingCallback.toString(),
        processingMode: {
          frequency: {
            hertz: 60
          }
        },
        inputs: [
          {
            internalName: 'clientPointer',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
          {
            internalName: 'mirrorPointer',
            messageFormat: 'bool'
          }
        ],
        outputs: [
          {
            internalName: 'serverPointer',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      };
      this.ubiiProcessingModule.inputClientPointer = this.ubiiProcessingModule.inputs[0];
      this.ubiiProcessingModule.inputMirrorPointer = this.ubiiProcessingModule.inputs[1];
      this.ubiiProcessingModule.outputServerPointer = this.ubiiProcessingModule.outputs[0];

      this.ubiiSession = {
        name: 'web-mouse-example-session',
        processingModules: [this.ubiiProcessingModule],
        ioMappings: [
          {
            processingModuleName: this.ubiiProcessingModule.name,
            inputMappings: [
              {
                inputName: this.ubiiProcessingModule.inputClientPointer.internalName,
                topicSource: 'topic',
                topic: this.ubiiComponentClientPointer.topic
              },
              {
                inputName: this.ubiiProcessingModule.inputMirrorPointer.internalName,
                topicSource: 'topic',
                topic: this.ubiiComponentMirrorPointer.topic
              }
            ],
            outputMappings: [
              {
                outputName: this.ubiiProcessingModule.outputServerPointer.internalName,
                topicDestination: 'topic',
                topic: this.ubiiComponentServerPointer.topic
              }
            ]
          }
        ]
      };
    },
    startExperiment: async function() {
      if (this.experimentStarted) {
        return;
      }

      //TODO

      this.experimentStarted = true;
    },
    stopExample: async function() {
      if (!this.experimentStarted) {
        return;
      }

      //TODO

      this.experimentStarted = false;
    },
    subscriptionServerPointerPosition: function(vec2) { 
      let boundingRect = document.getElementById('mouse-pointer-area').getBoundingClientRect();
      this.$data.serverMousePosition = {
        x: vec2.x * boundingRect.width,
        y: vec2.y * boundingRect.height
      };
    },
    publishClientPointerPosition: function(vec2) {
      if (this.publishImmediately) {
        UbiiClientService.instance.publishRecordImmediately({
          topic: this.ubiiComponentClientPointer.topic,
          vector2: vec2
        });
      } else {
        UbiiClientService.instance.publishRecord({
          topic: this.ubiiComponentClientPointer.topic,
          vector2: vec2
        });
      }
    },
    publishMirrorPointer: function(boolean) {
      UbiiClientService.instance.publishRecord({
        topic: this.ubiiComponentMirrorPointer.topic,
        bool: boolean
      });
    },
    onPublishIntervalChange: function(event) {
      UbiiClientService.instance.setPublishIntervalMs(event.target.value);
    },
    onMouseMove: function(event) {
      if (!this.experimentStarted) {
        return;
      }

      let boundingRect = document.getElementById('mouse-pointer-area').getBoundingClientRect();
      let relativeMousePosition = {
        x: (event.clientX - boundingRect.left) / boundingRect.width,
        y: (event.clientY - boundingRect.top) / boundingRect.height
      };

      this.clientMousePosition = relativeMousePosition;
      this.publishClientPointerPosition(this.clientMousePosition);
    },
    onTouchStart: function(event) {
      this.clientPointerInside = true;
      this.onTouchMove(event);
    },
    onTouchMove: function(event) {
      if (!this.experimentStarted) {
        return;
      }

      let relativeMousePosition = {
        x: (event.touches[0].clientX - event.target.offsetLeft) / event.target.offsetWidth,
        y: (event.touches[0].clientY - event.target.offsetTop) / event.target.offsetHeight
      };

      if (
        relativeMousePosition.x < 0 ||
        relativeMousePosition.x > 1 ||
        relativeMousePosition.y < 0 ||
        relativeMousePosition.y > 1
      ) {
        this.clientPointerInside = false;
        return;
      }

      this.clientMousePosition = relativeMousePosition;
      this.publishClientPointerPosition(this.clientMousePosition);
    }
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr;
  grid-template-rows: 30px 25px 1fr 200px;
  grid-template-areas:
    'app-header'
    'app-description'
    'app-display'
    'app-settings';
  height: 100%;
}

.app-header {
  grid-area: app-header;
  margin: 10px;
}

.app-description {
  grid-area: app-description;
}

.app-settings {
  grid-area: app-settings;
  display: flex;
  flex-direction: row;
  margin: 25px;
}

.mouse-pointer-area {
  grid-area: app-display;
  margin: 10px;
  background-color: white;
}

.button-start {
  width: 100px;
  height: 50px;
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

.hideCursor {
  cursor: none;
}

.server-mouse-position-indicator {
  color: black;
  position: relative;
}

.seperator {
  border-bottom: solid 1px orange;
  height: 10px;
  line-height: 20px;
  text-align: left;
}

.separator-label {
  display: inline;
  padding-left: 15px;
  padding-right: 20px;
  color: orange;
  background-color: black;
}
</style>
