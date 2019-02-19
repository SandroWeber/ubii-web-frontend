<template>
    <div>
        <div v-show="!ubiiClientService.isConnected">
            <span class="notification">Please connect to backend before starting the application.</span>
        </div>

        <div v-show="ubiiClientService.isConnected && !demoStarted">
            <button v-on:click="startDemo()">
                <font-awesome-icon icon="play" />
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
            <div class="mouse-pointer-area" v-bind:class="{ hideCursor: !showClientPointer }"
                 v-on:mousemove="onMouseMove($event)">
                <div class="server-mouse-position-indicator"
                     :style="{top: serverMousePosition.y + 'px', left: serverMousePosition.x + 'px' }"
                     v-show="showServerPointer">
                </div>
            </div>
        </div>
    </div>

</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faPlay } from '@fortawesome/free-solid-svg-icons'
  library.add(faPlay);

  export default {
    name: 'DemoMousePointer',
    data: () => {
      return {
        showClientPointer: true,
        showServerPointer: true,
        ubiiClientService: UbiiClientService,
        demoStarted: false,
        serverMousePosition: {x: 0, y: 0}
      }
    },
    methods: {
      startDemo: function() {
        // register the mouse pointer device
        let deviceName = 'web-demo-mouse-pointer';
        let topicName = UbiiClientService.getClientID() + '/' + deviceName + '/' + 'mouse_position';
        this.$data.device = {
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
        UbiiClientService.registerDevice(this.$data.device);

        // subscribe to the device topics
        UbiiClientService.client.subscribe(topicName, (mousePosition) => {
          this.$data.serverMousePosition = mousePosition;
        });

        this.$data.demoStarted = true;
      },
      onMouseMove: function(event) {
        /*let boundingRect = event.target.getBoundingClientRect();
        let relativeMousePosition = {
          x: Math.floor(event.clientX - boundingRect.left),
          y: Math.floor(event.clientY - boundingRect.top)
        };*/
        let relativeMousePosition = {
          x: event.offsetX,
          y: event.offsetY
        };

        let type = ProtobufLibrary.ubii.dataStructure.Vector2.prototype.constructor.name.toLowerCase();
        this.$data.clientMousePosition = relativeMousePosition;
        UbiiClientService.client.publish(
          this.$data.device.name,
          this.$data.device.components[1].topic,
          type,
          this.$data.clientMousePosition
        );
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
        margin: 25px;
    }

    .mouse-pointer-area {
        margin: 25px;
        border: 3px solid black;
        height: 500px;
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
