<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <fullscreen
        ref="fullscreen"
        class="controller"
        @change="onFullScreenChange"
        style="overflow: hidden;"
      >     
      <div
        class="main-div"
      >
         <!-- JOYCON mode for Controller -->
        <div class="interface" v-if="controllerMode === controllerModes.JOYCON">
        <ubii-game-pad />
        <!--ubii-gamepad /-->   
        </div>
        <!-- CAMERA mode for Controller -->
        <div class="interface" v-else-if="controllerMode === controllerModes.CAMERA">
        <!--ubii-game-camera /-->   
        <ubii-game-camera /> 
        </div>
         <button class="button-debug" @click="showDebugView = !showDebugView">
            Debug View
          </button>
        <div id="debug-view" class="debug-view" v-show="showDebugView">
            <span>Select controller mode:</span>
            <br />
            <button id="button-controllermode" @click="controllerMode = controllerModes.JOYCON">
            JOYCON
            </button>
            <br />
            <button id="button-controllermode" @click="controllerMode = controllerModes.CAMERA">
            CAMERA
            </button>
        </div>
      </div>
      </fullscreen>
    </div>
  </UbiiClientContent>
</template>

<script>
import Vue from 'vue';
import Fullscreen from 'vue-fullscreen';

import UbiiClientContent from '../applications/sharedModules/UbiiClientContent';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import UbiiGameCamera from './UbiiGameCamera';
import UbiiGamePad from './UbiiGamePad';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';

// enum for controller modes, default shall be joycon, TODO: ubii msg format?
const controllerModes = {
  JOYCON: 'joycon',
  CAMERA: 'camera',
  DEFAULT: 'default'
}

library.add([faExpand, faCompress]);

Vue.use(Fullscreen);

export default {
  name: 'Interface-UbiiController',
  components: { UbiiClientContent, UbiiGameCamera, UbiiGamePad },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopInterface();
    });

    UbiiClientService.instance.on(
      UbiiClientService.EVENTS.CONNECT,
      this.registerUbiiSpecs
    );
    UbiiClientService.instance.on(
      UbiiClientService.EVENTS.DISCONNECT,
      this.unregisterUbiiSpecs
    );

    this.deviceData = {};
    this.canvasDisplayArea = document.getElementById('canvas-display-area');
    UbiiClientService.instance.waitForConnection().then(() => {
      this.createUbiiSpecs();
      this.registerUbiiSpecs();
    });
    //this.toggleFullScreen();
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService.instance,
      ProtobufLibrary: ProtobufLibrary,
      initializing: false,
      hasRegisteredUbiiDevice: false,
      clientId: undefined,
      fullscreen: false,
      showDebugView: false,
      controllerModes,
      controllerMode: controllerModes.DEFAULT,
    };
  },
  methods: {
    stopInterface: function() {
      this.unregisterUbiiSpecs();
    },
    /* ubii methods */
    createUbiiSpecs: async function() {
      if (this.clientId) {
        console.warn('tried to create ubii specs, but are already present');
        return;
      }

      this.deviceName = 'web-interface-ubii-controller';

      this.clientId = UbiiClientService.instance.getClientID();
      let topicPrefix = '/' + this.clientId + '/' + this.deviceName;

      this.ubiiDevice = {
        name: this.deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [          
          {
            topic: topicPrefix + '/set_controllerMode',
            messageFormat: 'string',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          },       
        ]
      };

      this.componentSetControllerMode = this.ubiiDevice.components[0];
    },
    registerUbiiSpecs: function() {
      if (this.initializing || this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to register ubii controller, but is already registered'
        );
        return;
      }
      this.initializing = true;

      // register the mouse pointer device
      UbiiClientService.instance.waitForConnection().then(() => {
        UbiiClientService.instance.registerDevice(this.ubiiDevice)
          .then(device => {
            if (device.id) {
              this.ubiiDevice = device;
              this.hasRegisteredUbiiDevice = true;
              this.initializing = false;
            }
            return device;
          })
          .then(() => {           
            UbiiClientService.instance.subscribeTopic(
              this.componentSetControllerMode.topic,
              controllerMode => { 
                this.controllerMode = controllerMode;
              }
            )
          });
      });
    },
    unregisterUbiiSpecs: async function() {
      if (!this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to unregister ubii specs, but they are not registered.'
        );
        return;
      }

      if (this.ubiiDevice && this.ubiiDevice.components) {
        this.ubiiDevice.components.forEach(component => {
          UbiiClientService.instance.unsubscribeTopic(component.topic);
        });
      }

      this.hasRegisteredUbiiDevice = false;

      //TODO: this should not happen here, move to interaction
      UbiiClientService.instance.publishRecord({
        topic: 'removeClient',
        string: UbiiClientService.instance.getClientID()
      });

      // TODO: unregister device
      this.ubiiDevice &&
        (await UbiiClientService.instance.deregisterDevice(this.ubiiDevice));
    },
    /* helper methods */
    toggleFullScreen: function() {
      this.$refs['fullscreen'].toggle();
    },
    onFullScreenChange: function(fullscreen) {
      this.fullscreen = fullscreen;
    },
  }
};
</script>

<style scoped>
.controller {
  height: 100%;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  justify-items: center;
  align-items: center;
}

.main-div{
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    'btn-debug'
    'debug-view'
    'interface-area';
}

.interface{
  grid-area: interface-area;
}

.button-debug {
  grid-area: btn-debug;
}

.debug-view {
  grid-area: debug-view;
}

.whitespace {
  width: 100px;
  height: 100px;
}

.start-select-area {
  grid-area: start-select;
  height: 100%;
  width: 100%;
  text-align: center;
}

.touch-area {
  grid-area: touch-area;
  width: 100%;
  height: 100%;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.buttons {
  grid-area: buttons;
  border-radius: 50%;
  width: 400px;
  height: 400px;
}

.action-button {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(white, grey);
  font-size: xx-large;
  font-weight: bold;
}

.notification {
  color: red;
}

.button-fullscreen {
  grid-area: button-fullscreen;
  width: 30px;
  height: 30px;
}

.debug-log {
  grid-area: debug-log;
}

.canvas-display-area {
  width: 100%;
  height: 100%;
}
</style>
