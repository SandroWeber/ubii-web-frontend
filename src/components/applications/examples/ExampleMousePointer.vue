<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div class="grid">
      <div class="seperator header-demo">
        <span class="separator-label">Demo</span>
      </div>

      <div class="options">
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
      </div>

      <!-- the interaction area.
      if our pointer is inside, its position is sent to the server and back to us, then displayed as a red square-->
      <div
        id="mouse-pointer-area"
        class="mouse-pointer-area"
        v-bind:class="{ hideCursor: !showClientPointer }"
        v-on:mousemove="onMouseMove($event)"
        v-on:mouseenter="clientPointerInside = true;"
        v-on:mouseleave="clientPointerInside = false;"
        v-on:touchstart="onTouchStart($event)"
        v-on:touchend="clientPointerInside = false;"
        v-on:touchmove="onTouchMove($event)"
      >
        <!-- this is the red square indicator of the pointer position sent back to us by the server
        you can see its position via style - top/left being linked to the data variable "serverMousePosition"-->
        <div
          class="server-mouse-position-indicator"
          :style="{top: serverMousePosition.y + 'px', left: serverMousePosition.x + 'px' }"
          v-show="showServerPointer && clientPointerInside"
        ></div>
      </div>

      <div class="seperator header-description">
        <span class="separator-label">Description</span>
      </div>

      <div class="description-general">
        Placing your mouse inside the above area will show your mouse indicator (arrow) as well as a red square.
        The basic idea of this demo is to send the mouse position to the Ubi-Interact backend, which will send
        it back to us so we can display it (red square).
        <br />Reading the code of this example will show your how to register a device with Ubi-Interact defining the topics for data communication.
        It also shows you how to publish (send) and subcribe (receive) to topics.
        A small session+interaction is also specified and communicated to Ubi-Interact that can manipulate the communicated mouse position.
        You can see in the code how to specify this interaction on the client side, link it to the topics of our device and start it.
      </div>

      <div class="description-options">
        You can toggle whether the client/server side mouse indicator should be shown.
        "Mirror Pointer" will tell the interaction to invert your client mouse position in X and Y.
      </div>

      <div class="description-mouse-area">
        Moving your mouse inside this area will publish its current position normalized to ([0;1] , [0;1]) on the topic ".../mouse_client_position".
        An interaction in the backend will read this client position. If the flag "mirror pointer" is set, the interaction
        will invert the client position. The interaction will then write the new position to the topic ".../mouse_server_position", which we subscribe to.
        Once we receive data on the ".../mouse_server_position" topic, the position of the server pointer indicator (red square) will be updated.
      </div>
    </div>
  </UbiiClientContent>
</template>

<script>
import UbiiClientContent from '../sharedModules/UbiiClientContent';
import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import { mapActions } from 'vuex';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

library.add(faPlay);

/* eslint-disable no-console */

export default {
  name: 'ExampleMousePointer',
  components: { UbiiClientContent },
  /* STEP 1: mounted() is our vue component entry point, start here! */
  mounted: function() {
    // unsubscribe before page is suddenly closed
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    // some event hooks to restart/stop the experiment if necessary
    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stopExample();
      this.startExample();
    });

    // make sure we're connected, then start the example
    UbiiClientService.isConnected().then(() => {
      this.startExample();
    });

    UbiiClientService.onDisconnect(() => {
      this.stopExample();
    });
  },
  beforeDestroy: function() {
    this.stopExample();
  },
  data: () => {
    return {
      showClientPointer: true,
      showServerPointer: true,
      mirrorPointer: false,
      ubiiClientService: UbiiClientService,
      exampleStarted: false,
      serverMousePosition: { x: 0, y: 0 },
      clientPointerInside: false
    };
  },
  watch: {
    mirrorPointer: function(value) {
      if (
        !UbiiClientService.isConnected ||
        !this.$data.ubiiDevice.name ||
        !this.$data.inputMirror.topic
      ) {
        return;
      }

      // if the checkbox is changed, we publish this info on the related topic
      UbiiClientService.publishRecord({
        topic: this.$data.inputMirror.topic,
        bool: value
      });
    }
  },
  methods: {
    createUbiiSpecs: function() {
      // create specifications for the protobuf messages

      // helper definitions that we can reference later
      let deviceName = 'web-example-mouse-pointer';
      let topicPrefix =
        '/' + UbiiClientService.getClientID() + '/' + deviceName;
      let inputClientPointer = {
        internalName: 'clientPointer',
        messageFormat: 'ubii.dataStructure.Vector2',
        topic: topicPrefix + '/' + 'mouse_client_position'
      };
      let inputMirror = {
        internalName: 'mirrorPointer',
        messageFormat: 'bool',
        topic: topicPrefix + '/' + 'mirror_mouse'
      };
      let outputServerPointer = {
        internalName: 'serverPointer',
        messageFormat: 'ubii.dataStructure.Vector2',
        topic: topicPrefix + '/' + 'mouse_server_position'
      };

      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: inputClientPointer.topic,
            messageFormat: inputClientPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: inputMirror.topic,
            messageFormat: inputMirror.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: outputServerPointer.topic,
            messageFormat: outputServerPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };

      // specification of a ubii.interactions.Interaction
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/interactions/interaction.proto
      let processingCallback = (input, output) => {
        if (!input.clientPointer) {
          return;
        }

        if (input.mirrorPointer === true) {
          output.serverPointer = {
            x: 1 - input.clientPointer.x,
            y: 1 - input.clientPointer.y
          };
        } else {
          output.serverPointer = {
            x: input.clientPointer.x,
            y: input.clientPointer.y
          };
        }
      };

      let ubiiInteraction = {
        id: uuidv4(),
        name: 'mirror-mouse-pointer',
        processingCallback: processingCallback.toString(),
        processFrequency: 60,
        inputFormats: [
          {
            internalName: inputClientPointer.internalName,
            messageFormat: inputClientPointer.messageFormat
          },
          {
            internalName: inputMirror.internalName,
            messageFormat: inputMirror.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: outputServerPointer.internalName,
            messageFormat: outputServerPointer.messageFormat
          }
        ]
      };

      // specification of a ubii.sessions.Session
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      let ubiiSession = {
        id: uuidv4(),
        name: 'web-mouse-example-session',
        interactions: [ubiiInteraction],
        ioMappings: [
          {
            interactionId: ubiiInteraction.id,
            inputMappings: [
              {
                name: inputClientPointer.internalName,
                topicSource: inputClientPointer.topic
              },
              {
                name: inputMirror.internalName,
                topicSource: inputMirror.topic
              }
            ],
            outputMappings: [
              {
                name: outputServerPointer.internalName,
                topicDestination: outputServerPointer.topic
              }
            ]
          }
        ]
      };

      // assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.inputClientPointer = inputClientPointer;
      this.$data.inputMirror = inputMirror;
      this.$data.outputServerPointer = outputServerPointer;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiInteraction = ubiiInteraction;

      this.$data.ubiiSession = ubiiSession;
    },
    /* STEP 2: making all calls related to ubi-interact backend */
    startExample: function() {
      // make sure we're connected, then continue
      UbiiClientService.isConnected().then(() => {
        // create all the specifications we need to define our example application
        // these are protobuf messages to be sent to the server (saved in this.$data)
        this.createUbiiSpecs();

        // register the mouse pointer device
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then(response => {
            // the device specs we send to backend intentionally left out the device ID
            // if the backend accepts the device registration, it will send back our specs
            // plus any necessary info (like the ID) filled in by the backend
            // that way we make sure the ID is created by the backend and valid
            if (response.id) {
              // success, we accept the device specs sent back to us as the final specs
              this.$data.ubiiDevice = response;
              return this.$data.ubiiDevice;
            } else {
              // something went wrong, print to console
              return undefined;
            }
          })
          .then(() => {
            // subscribe to the device topics so we are notified when new data arrives on the topic
            UbiiClientService.subscribe(
              this.$data.outputServerPointer.topic,
              // a callback to be called when new data on this topic arrives
              mousePosition => {
                // when we get a normalized server pointer position, we calculate back to absolute (x,y) within the
                // interaction area and set our red square indicator
                let boundingRect = document
                  .getElementById('mouse-pointer-area')
                  .getBoundingClientRect();
                this.$data.serverMousePosition = {
                  x: mousePosition.x * boundingRect.width,
                  y: mousePosition.y * boundingRect.height
                };
              }
            );

            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(response => {
                if (response.success) {
                  this.$data.exampleStarted = true;
                }
              });
          });
      });
    },
    stopExample: async function() {
      if (!this.exampleStarted) return;

      this.exampleStarted = false;

      // unsubscribe and stop session
      UbiiClientService.unsubscribe(this.$data.outputServerPointer.topic);
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });

      if (this.$data.ubiiDevice) {
        await UbiiClientService.deregisterDevice(this.$data.ubiiDevice);
      }
    },
    onMouseMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current mouse position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let boundingRect = document
        .getElementById('mouse-pointer-area')
        .getBoundingClientRect();
      let relativeMousePosition = {
        x: (event.clientX - boundingRect.left) / boundingRect.width,
        y: (event.clientY - boundingRect.top) / boundingRect.height
      };

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client mouse position
      UbiiClientService.publishRecord({
        topic: this.$data.inputClientPointer.topic,
        vector2: this.$data.clientMousePosition
      });
    },
    onTouchStart: function(event) {
      this.$data.clientPointerInside = true;
      this.onTouchMove(event);
    },
    onTouchMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current touch position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let relativeMousePosition = {
        x:
          (event.touches[0].clientX - event.target.offsetLeft) /
          event.target.offsetWidth,
        y:
          (event.touches[0].clientY - event.target.offsetTop) /
          event.target.offsetHeight
      };

      if (
        relativeMousePosition.x < 0 ||
        relativeMousePosition.x > 1 ||
        relativeMousePosition.y < 0 ||
        relativeMousePosition.y > 1
      ) {
        this.$data.clientPointerInside = false;
        return;
      }

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client touch position
      UbiiClientService.publishRecord({
        topic: this.$data.inputClientPointer.topic,
        vector2: this.$data.clientMousePosition
      });
    },
    ...mapActions('interactions', {
      addInteraction: 'add'
    })
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 2fr 6fr;
  grid-template-rows: 30px 300px 30px auto auto;
  grid-template-areas:
    'header-demo header-demo'
    'demo-options demo-mouse-area'
    'header-description header-description'
    'description-general description-general'
    'description-options description-mouse-area';
  height: 100%;
}

.options {
  grid-area: demo-options;
  margin: 25px;
}

.mouse-pointer-area {
  grid-area: demo-mouse-area;
  margin: 10px;
  border: 3px solid white;
}

.hideCursor {
  cursor: none;
}

.server-mouse-position-indicator {
  position: relative;
  width: 10px;
  height: 10px;
  background-color: red;
}

.start-example {
  text-align: center;
  margin-top: 25px;
}

.start-example-button {
  width: 50px;
  height: 50px;
}

.description-general {
  grid-area: description-general;
  padding: 20px;
}

.description-options {
  grid-area: description-options;
  padding: 20px;
}

.description-mouse-area {
  grid-area: description-mouse-area;
  padding: 20px;
}

.header-demo {
  grid-area: header-demo;
  margin: 10px;
}

.header-description {
  grid-area: header-description;
  margin: 10px;
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
