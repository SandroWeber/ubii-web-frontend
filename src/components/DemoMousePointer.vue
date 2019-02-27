<template>
    <div>
        <div v-show="!ubiiClientService.isConnected">
            <span class="notification">Please connect to backend before starting the application.</span>
        </div>

        <div v-show="ubiiClientService.isConnected && !demoStarted">
            <button v-on:click="startDemo()">
                <font-awesome-icon icon="play"/>
            </button>
        </div>
        <div v-show="ubiiClientService.isConnected && demoStarted" class="grid">
            <div class="options">
                <input id="checkboxClientPointer" type="checkbox" v-model="showClientPointer"/>
                <label for="checkboxClientPointer">Show Client Pointer</label>
                <br/>
                <input id="checkboxServerPointer" type="checkbox" v-model="showServerPointer"/>
                <label for="checkboxServerPointer">Show Server Pointer</label>
            </div>
            <div id="mouse-pointer-area" class="mouse-pointer-area" v-bind:class="{ hideCursor: !showClientPointer }"
                 v-on:mousemove="onMouseMove($event)"
                 v-on:mouseenter="clientPointerInside = true;" v-on:mouseleave="clientPointerInside = false;"
                 v-on:touchstart="onTouchStart($event)" v-on:touchend="clientPointerInside = false;"
                 v-on:touchmove="onTouchMove($event)">
                <div class="server-mouse-position-indicator"
                     :style="{top: serverMousePosition.y + 'px', left: serverMousePosition.x + 'px' }"
                     v-show="showServerPointer && clientPointerInside">
                </div>
            </div>
        </div>
    </div>

</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

  /* fontawesome */
  import {library} from '@fortawesome/fontawesome-svg-core'
  import {faPlay} from '@fortawesome/free-solid-svg-icons'
  library.add(faPlay);

  /* eslint-disable no-console */

  export default {
    name: 'DemoMousePointer',
    data: () => {
      return {
        showClientPointer: true,
        showServerPointer: true,
        ubiiClientService: UbiiClientService,
        demoStarted: false,
        serverMousePosition: {x: 0, y: 0},
        clientPointerInside: false
      }
    },
    methods: {
      startDemo: function () {
        // register the mouse pointer device
        let deviceName = 'web-demo-mouse-pointer';
        let topicName = UbiiClientService.getClientID() + '/' + deviceName + '/' + 'mouse_position';
        this.$data.ubiiDevice = {
          name: deviceName,
          deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
          components: [
            {
              topic: topicName,
              messageFormat: 'ubii.dataStructure.Vector2',
              ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
            },
            {
              topic: topicName,
              messageFormat: 'ubii.dataStructure.Vector2',
              ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
            }
          ]
        };
        UbiiClientService.registerDevice(this.$data.ubiiDevice).then((device) => {
          console.info(device);
        });

        // subscribe to the device topics
        UbiiClientService.client.subscribe(topicName, (mousePosition) => {
          let boundingRect = document.getElementById('mouse-pointer-area').getBoundingClientRect();
          this.$data.serverMousePosition = {
            x: mousePosition.x * boundingRect.width,
            y: mousePosition.y * boundingRect.height
          };
        });

        let ubiiInteraction = {
          name: 'mirror-mouse-pointer',
          processingCallback: '(input, output, state) => {' +
          'if (input.mirrorPointer === true) {' +
          'output.pointer = {x: 1-input.pointer.x, y: 1-input.pointer.y};' +
          '} else {' +
          'output.pointer = {x: input.pointer.x, y: input.pointer.y};' +
          '};'
        };

        let ubiiSession = {
          name: 'web-mouse-demo-session',
          interactions: [
            ubiiInteraction
          ],
          ioMappings: []
        };

        this.$data.demoStarted = true;
      },
      onMouseMove: function (event) {
        let boundingRect = event.currentTarget.getBoundingClientRect();
        let relativeMousePosition = {
          x: event.offsetX / boundingRect.width,
          y: event.offsetY / boundingRect.height
        };

        let type = ProtobufLibrary.ubii.dataStructure.Vector2.prototype.constructor.name.toLowerCase();
        this.$data.clientMousePosition = relativeMousePosition;
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.ubiiDevice.components[1].topic,
          type,
          this.$data.clientMousePosition
        );
      },
      onTouchStart: function (event) {
        this.$data.clientPointerInside = true;
        this.onTouchMove(event);
      },
      onTouchMove: function (event) {
        console.info(event.touches[0]);
        let relativeMousePosition = {
          x: event.touches[0].clientX - event.target.offsetLeft,
          y: event.touches[0].clientY - event.target.offsetTop
        };

        if (relativeMousePosition.x < 0 || relativeMousePosition.x > event.target.offsetWidth ||
          relativeMousePosition.y < 0 || relativeMousePosition.y > event.target.offsetHeight) {
          this.$data.clientPointerInside = false;
          return;
        }

        let type = ProtobufLibrary.ubii.dataStructure.Vector2.prototype.constructor.name.toLowerCase();
        this.$data.clientMousePosition = relativeMousePosition;
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.ubiiDevice.components[1].topic,
          type,
          this.$data.clientMousePosition
        );
      },
      log: function (object) {
        console.info(object);
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .grid {
        display: grid;
        grid-gap: 15px;
        grid-template-columns: 1fr 5fr;
        height: 100%;
    }

    .options {
        margin: 25px;
    }

    .mouse-pointer-area {
        margin: 25px;
        border: 3px solid black;
        height: 300px;
    }

    .hideCursor {
        cursor: none;
    }

    .notification {
        color: red;
    }

    .server-mouse-position-indicator {
        position: relative;
        width: 10px;
        height: 10px;
        background-color: red;
    }
</style>
