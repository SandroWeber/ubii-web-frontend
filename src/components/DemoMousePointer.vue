<template>
  <div>
    <div v-show="!ubiiClientService.isConnected">
      <span class="notification">
        Please connect to backend before starting the application.
      </span>
    </div>

    <div v-show="ubiiClientService.isConnected && !demoStarted">
      <button v-on:click="startDemo()">
        <font-awesome-icon icon="play"/>
      </button>
    </div>

    <div
      v-show="ubiiClientService.isConnected && demoStarted"
      class="grid"
    >
      <div class="options">
        <input
          id="checkboxClientPointer"
          type="checkbox"
          v-model="showClientPointer"
        />
        <label for="checkboxClientPointer">
          Show Client Pointer
        </label>

        <br/>

        <input 
          id="checkboxServerPointer"
          type="checkbox"
          v-model="showServerPointer"
        />
        <label for="checkboxServerPointer">
          Show Server Pointer
        </label>

        <br/>

        <input
          id="checkboxMirrorPointer"
          type="checkbox"
          v-model="mirrorPointer"
        />
        <label for="checkboxMirrorPointer">
          Mirror Pointer
        </label>
      </div>

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
        <div
          class="server-mouse-position-indicator"
          :style="{top: serverMousePosition.y + 'px', left: serverMousePosition.x + 'px' }"
          v-show="showServerPointer && clientPointerInside"
        >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import uuidv4 from 'uuid/v4';
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
  import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

  import { mapState, mapActions } from 'vuex'

  /* fontawesome */
  import {library} from '@fortawesome/fontawesome-svg-core'
  import {faPlay} from '@fortawesome/free-solid-svg-icons'

  library.add(faPlay);

  /* eslint-disable no-console */

  export default {
    name: 'DemoMousePointer',
    mounted: function() {
      // unsubscribe before page is unloaded
      window.addEventListener('beforeunload', () => {
        this.stopDemo();
      });
    },
    beforeDestroy: function() {
      this.stopDemo();
    },
    data: () => {
      return {
        showClientPointer: true,
        showServerPointer: true,
        mirrorPointer: false,
        ubiiClientService: UbiiClientService,
        demoStarted: false,
        serverMousePosition: {x: 0, y: 0},
        clientPointerInside: false
      }
    },
    watch: {
      mirrorPointer: function (value) {
        if (!UbiiClientService.isConnected || !this.$data.ubiiDevice.name || !this.$data.inputMirror.topic) {
          return;
        }
        
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.inputMirror.topic,
          'boolean',
          value
        );
      }
    },
    methods: {
      startDemo: function () {
        this.createUbiiSpecs();

        // register the mouse pointer device
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then((device) => {
            this.$data.ubiiDevice = device;
            return device;
          })
          .then(() => {
            // subscribe to the device topics
            UbiiClientService.client.subscribe(this.$data.outputServerPointer.topic, (mousePosition) => {
              let boundingRect = document.getElementById('mouse-pointer-area').getBoundingClientRect();
              this.$data.serverMousePosition = {
                x: mousePosition.x * boundingRect.width,
                y: mousePosition.y * boundingRect.height
              };
            });

            UbiiClientService.registerSession(this.$data.ubiiSession)
              .then((session) => {
                this.$data.ubiiSession = session;
                return session;
              })
              .then(() => {
                UbiiClientService.client
                  .callService({
                    topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                    session: this.$data.ubiiSession
                  })
                  .then(() => {
                    this.$data.demoStarted = true;
                  });
              });
          });
      },
      onMouseMove: function (event) {
        let boundingRect = event.currentTarget.getBoundingClientRect();
        let relativeMousePosition = {
          x: event.offsetX / boundingRect.width,
          y: event.offsetY / boundingRect.height
        };

        this.$data.clientMousePosition = relativeMousePosition;
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.inputClientPointer.topic,
          'vector2',
          this.$data.clientMousePosition
        );
      },
      onTouchStart: function (event) {
        this.$data.clientPointerInside = true;
        this.onTouchMove(event);
      },
      onTouchMove: function (event) {
        let relativeMousePosition = {
          x: (event.touches[0].clientX - event.target.offsetLeft) / event.target.offsetWidth,
          y: (event.touches[0].clientY - event.target.offsetTop) / event.target.offsetHeight
        };

        if (relativeMousePosition.x < 0 || relativeMousePosition.x > 1 ||
          relativeMousePosition.y < 0 || relativeMousePosition.y > 1) {
          this.$data.clientPointerInside = false;
          return;
        }

        this.$data.clientMousePosition = relativeMousePosition;
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.inputClientPointer.topic,
          'vector2',
          this.$data.clientMousePosition
        );
      },
      createUbiiSpecs: function () {
        let deviceName = 'web-demo-mouse-pointer';

        let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
        let inputClientPointer = {
          internalName: 'clientPointer',
          messageFormat: 'ubii.dataStructure.Vector2',
          topic: topicPrefix + '/' + 'mouse_client_position'
        };
        let inputMirror = {
          internalName: 'mirrorPointer',
          messageFormat: 'boolean',
          topic: topicPrefix + '/' + 'mirror_mouse'
        };
        let outputServerPointer = {
          internalName: 'serverPointer',
          messageFormat: 'ubii.dataStructure.Vector2',
          topic: topicPrefix + '/' + 'mouse_server_position'
        };

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

        let processingCallback = (input, output) => {
          if (!input.clientPointer) {
            return;
          }

          if (input.mirrorPointer === true) {
            output.serverPointer = {x: 1 - input.clientPointer.x, y: 1 - input.clientPointer.y};
          } else {
            output.serverPointer = {x: input.clientPointer.x, y: input.clientPointer.y};
          }
        };

        let ubiiInteraction = {
          id: uuidv4(),
          name: 'mirror-mouse-pointer',
          processingCallback: processingCallback.toString(),
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

        let ubiiSession = {
          id: uuidv4(),
          name: 'web-mouse-demo-session',
          interactions: [
            ubiiInteraction
          ],
          ioMappings: [
            {
              interactionId: ubiiInteraction.id,
              interactionInput: {
                internalName: inputClientPointer.internalName,
                messageFormat: inputClientPointer.messageFormat
              },
              topic: inputClientPointer.topic
            },
            {
              interactionId: ubiiInteraction.id,
              interactionInput: {
                internalName: inputMirror.internalName,
                messageFormat: inputMirror.messageFormat
              },
              topic: inputMirror.topic
            },
            {
              interactionId: ubiiInteraction.id,
              interactionOutput: {
                internalName: outputServerPointer.internalName,
                messageFormat: outputServerPointer.messageFormat
              },
              topic: outputServerPointer.topic
            }
          ]
        };

        this.$data.deviceName = deviceName;
        this.$data.inputClientPointer = inputClientPointer;
        this.$data.inputMirror = inputMirror;
        this.$data.outputServerPointer = outputServerPointer;
        this.$data.ubiiDevice = ubiiDevice;
        this.$data.ubiiInteraction = ubiiInteraction;

        this.addInteraction({interaction: ubiiInteraction});

        this.$data.ubiiSession = ubiiSession;
      },
      stopDemo: function() {
        UbiiClientService.client.unsubscribe(this.$data.outputServerPointer.topic);
        UbiiClientService.client
          .callService({
            topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
            session: this.$data.ubiiSession
          });
      },
      ...mapActions('interactions', {
          addInteraction: 'add'
      }),
    }
  }
</script>

<style scoped lang="stylus">
    .grid
        display: grid
        grid-gap: 15px
        grid-template-columns: 1fr 5fr
        height: 100%

    .options
        margin: 25px

    .mouse-pointer-area
        margin: 25px
        border: 3px solid black
        height: 300px

    .hideCursor
        cursor: none

    .notification
        color: red

    .server-mouse-position-indicator
        position: relative
        width: 10px
        height: 10px
        background-color: red
</style>
