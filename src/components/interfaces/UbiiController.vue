<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <fullscreen
        ref="fullscreen"
        class="controller"
        @change="onFullScreenChange"
        style="overflow: hidden;"
      >
        <div class="debug-log">{{debugLog}}</div>
        <button class="button-fullscreen" @click="toggleFullScreen()">
          <font-awesome-icon icon="compress" class="interface-icon" v-show="fullscreen" />
          <font-awesome-icon icon="expand" class="interface-icon" v-show="!fullscreen" />
        </button>
        <div id="analog-left" class="analog-left">
          <div class="analog-ring">
            <div
              id="analog-stick-left"
              class="analog-stick"
              v-on:touchstart="onTouchStart($event)"
              v-on:touchmove="onTouchMove($event)"
              v-on:touchend="onTouchEnd($event)"
              :style="{top: stickPosition['analog-stick-left'].y + '%', left: stickPosition['analog-stick-left'].x + '%' }"
            ></div>
          </div>
        </div>
        <div id="a-button" class="a-button">
          <button
            @touchstart="publishPressedActionButton(1)"
            @touchend="publishReleasedActionButton(1)"
            class="action-button"
          >A</button>
        </div>
        <div id="b-button" class="b-button">
          <button
            @touchstart="publishPressedActionButton(2)"
            @touchend="publishReleasedActionButton(2)"
            class="action-button"
          >B</button>
        </div>
        <div id="start-select-area" class="start-select-area">
          <button
            @touchstart="publishButtonStart(ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN)"
            @touchend="publishButtonStart(ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP)"
            class="start-button"
          >Start</button>
        </div>
        <div id="ubii-controller-touch-area" class="touch-area"></div>
      </fullscreen>
    </div>
  </UbiiClientContent>
</template>

<script>
import Vue from 'vue';
import Fullscreen from 'vue-fullscreen';

import UbiiClientContent from '../applications/sharedModules/UbiiClientContent';
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import UbiiEventBus from '../../services/ubiiClient/ubiiEventBus';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { setTimeout } from 'timers';

library.add([faExpand, faCompress]);

Vue.use(Fullscreen);

/* eslint-disable no-console */

export default {
  name: 'Interface-SmartDevice',
  components: { UbiiClientContent },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopInterface();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, this.registerUbiiSpecs);
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.unregisterUbiiSpecs);

    this.deviceData = {};
    this.registerEventListeners();
    UbiiClientService.isConnected().then(() => {
      this.createUbiiSpecs();
      this.registerUbiiSpecs();
    });
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  data: () => {
    let stickPos = {};
    stickPos['analog-stick-left'] = { x: 25, y: 25 };
    stickPos['analog-stick-right'] = { x: 25, y: 25 };

    return {
      ubiiClientService: UbiiClientService,
      ProtobufLibrary: ProtobufLibrary,
      initializing: false,
      hasRegisteredUbiiDevice: false,
      clientId: undefined,
      publishFrequency: 0.01,
      fullscreen: false,
      stickPosition: stickPos,
      debugLog: 'have fun :)'
    };
  },
  methods: {
    stopInterface: function() {
      this.unregisterEventListeners();
      this.unregisterUbiiSpecs();
    },
    /* ubii methods */
    createUbiiSpecs: function() {
      if (this.clientId) {
        console.warn('tried to create ubii specs, but are already present');
        return;
      }

      this.deviceName = 'web-interface-ubii-controller';

      this.clientId = UbiiClientService.getClientID();
      let topicPrefix = '/' + this.clientId + '/' + this.deviceName;

      this.ubiiDevice = {
        name: this.deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: topicPrefix + '/orientation',
            messageFormat: 'ubii.dataStructure.Vector3',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/linear_acceleration',
            messageFormat: 'ubii.dataStructure.Vector3',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/analog_stick_left',
            messageFormat: 'ubii.dataStructure.Vector2',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/button_a',
            messageFormat: 'ubii.dataStructure.KeyEvent',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/button_b',
            messageFormat: 'ubii.dataStructure.KeyEvent',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/button_start',
            messageFormat: 'ubii.dataStructure.KeyEvent',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/set_color',
            messageFormat: 'ubii.dataStructure.Color',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };
      // add vibration component if available
      navigator.vibrate =
        navigator.vibrate ||
        navigator.webkitVibrate ||
        navigator.mozVibrate ||
        navigator.msVibrate;
      if (navigator.vibrate) {
        this.componentVibration = {
          topic: topicPrefix + '/vibration_pattern',
          messageFormat: 'double',
          ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
        };
        this.ubiiDevice.components.push(this.componentVibration);
        this.tNextVibrate = Date.now();
        navigator.vibrate(100);
      }

      this.componentOrientation = this.ubiiDevice.components[0];
      this.componentLinearAcceleration = this.ubiiDevice.components[1];
      this.componentAnalogstickLeft = this.ubiiDevice.components[2];
      this.componentButtonA = this.ubiiDevice.components[3];
      this.componentButtonB = this.ubiiDevice.components[4];
      this.componentButtonStart = this.ubiiDevice.components[5];
      this.componentSetColor = this.ubiiDevice.components[6];
    },
    registerUbiiSpecs: function() {
      if (this.initializing || this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to register ubii device, but is already registered'
        );
        return;
      }
      this.initializing = true;

      // register the mouse pointer device
      UbiiClientService.isConnected().then(() => {
        UbiiClientService.registerDevice(this.ubiiDevice)
          .then(device => {
            if (device.id) {
              this.ubiiDevice = device;
              this.hasRegisteredUbiiDevice = true;
              this.initializing = false;
              this.publishContinuousDeviceData();
            }
            return device;
          })
          .then(() => {
            UbiiClientService.subscribe(this.componentSetColor.topic, color => {
              let colorString =
                'rgba(' +
                [color.r * 255, color.g * 255, color.b * 255, color.a].join(
                  ','
                ) +
                ')';
              document.getElementById(
                'ubii-controller-touch-area'
              ).style.backgroundColor = colorString;
            });

            if (this.componentVibration) {
              UbiiClientService.subscribe(
                this.componentVibration.topic,
                vibrationPattern => {
                  if (Date.now() >= this.tNextVibrate) {
                    navigator.vibrate(vibrationPattern);
                    this.tNextVibrate = Date.now() + 2 * vibrationPattern;
                  }
                }
              );
            }
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
          // eslint-disable-next-line no-console
          console.log('unsubscribed to ' + component.topic);

          UbiiClientService.unsubscribe(component.topic);
        });
      }

      this.hasRegisteredUbiiDevice = null;

      //TODO: this should not happen here, move to interaction
      UbiiClientService.publishRecord({
        topic: 'removeClient',
        string: UbiiClientService.getClientID()
      });

      // TODO: unregister device
      this.ubiiDevice &&
        (await UbiiClientService.deregisterDevice(this.ubiiDevice));
    },
    publishContinuousDeviceData: function() {
      this.deviceData['analog-stick-left'] &&
        this.publishAnalogStickPosition(this.deviceData['analog-stick-left']);

      this.deviceData.currentOrientation &&
        this.publishDeviceOrientation(this.deviceData.currentOrientation);

      this.deviceData.acceleration &&
        this.publishDeviceMotion(this.deviceData.acceleration);

      // call loop
      if (this.hasRegisteredUbiiDevice) {
        setTimeout(
          this.publishContinuousDeviceData,
          this.publishFrequency * 1000
        );
      }
    },
    publishDeviceOrientation: function(orientation) {
      let current = (this.deviceData.currentOrientation = {
        x: this.round(orientation.x, 2),
        y: this.round(orientation.y, 2),
        z: this.round(orientation.z, 2)
      });
      let calibrated = this.deviceData.calibratedOrientation || {
        x: 0,
        y: 0,
        z: 0
      };

      let fixed = {
        x: current.x - calibrated.x,
        y: current.y - calibrated.y,
        z: current.z - calibrated.z
      };

      this.deviceData.fixedCalibratedOrientation = fixed;

      UbiiClientService.publishRecord({
        topic: this.componentOrientation.topic,
        vector3: fixed
      });
    },
    publishDeviceMotion: function(acceleration) {
      UbiiClientService.publishRecord({
        topic: this.componentLinearAcceleration.topic,
        vector3: {
          x: this.round(acceleration.x, 2),
          y: this.round(acceleration.y, 2),
          z: this.round(acceleration.z, 2)
        }
      });
    },
    publishButtonStart: function(keyEventType) {
      UbiiClientService.publishRecord({
        topic: this.componentButtonStart.topic,
        keyEvent: {
          type: keyEventType,
          key: 'start'
        }
      });
    },
    publishPressedActionButton: function(buttonID) {
      let topic = '';
      if (buttonID === 1) {
        topic = this.componentButtonA.topic;
      } else if (buttonID === 2) {
        topic = this.componentButtonB.topic;
      }
      UbiiClientService.publishRecord({
        topic: topic,
        keyEvent: {
          type: ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN,
          key: buttonID.toString()
        }
      });
    },
    publishReleasedActionButton: function(buttonID) {
      let topic = '';
      if (buttonID === 1) {
        topic = this.componentButtonA.topic;
      } else if (buttonID === 2) {
        topic = this.componentButtonB.topic;
      }
      UbiiClientService.publishRecord({
        topic: topic,
        keyEvent: {
          type: ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP,
          key: buttonID.toString()
        }
      });
    },
    publishAnalogStickPosition: function(stickPosition) {
      UbiiClientService.publishRecord({
        topic: this.componentAnalogstickLeft.topic,
        vector2: stickPosition
      });
    },
    /* event methods */
    registerEventListeners: function() {
      window.addEventListener(
        'deviceorientation',
        this.onDeviceOrientation,
        true
      );
      window.addEventListener('devicemotion', this.onDeviceMotion, true);
    },
    unregisterEventListeners: function() {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation);
      window.removeEventListener('devicemotion', this.onDeviceMotion);
    },
    onTouchStart: function(event) {
      this.deviceData.touches = event.touches;

      this.deviceData[event.target.id] = this.normalizeAnalogStickCoordinates(
        event,
        0
      );
      this.$data.stickPosition[event.target.id].x =
        (this.deviceData[event.target.id].x + 1) * 25;
      this.$data.stickPosition[event.target.id].y =
        (-this.deviceData[event.target.id].y + 1) * 25;
    },
    onTouchMove: function(event) {
      this.deviceData.touches = event.touches;

      this.deviceData[event.target.id] = this.normalizeAnalogStickCoordinates(
        event,
        0
      );
      this.$data.stickPosition[event.target.id].x =
        (this.deviceData[event.target.id].x + 1) * 25;
      this.$data.stickPosition[event.target.id].y =
        (-this.deviceData[event.target.id].y + 1) * 25;
    },
    onTouchEnd: function(event) {
      this.deviceData.touches = event.touches;
      this.deviceData['analog-stick-left'] = { x: 0, y: 0 };
      this.$data.stickPosition[event.target.id] = { x: 25, y: 25 };
    },
    onDeviceOrientation: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
      this.deviceData.currentOrientation = {
        x: event.alpha,
        y: event.beta,
        z: event.gamma
      };
    },
    onDeviceMotion: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
      this.deviceData.acceleration = event.acceleration;
      this.deviceData.rotationRate = event.rotationRate;
    },
    /* helper methods */
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },
    normalizeAnalogStickCoordinates: function(event, touchIndex) {
      let analogRing = event.target.parentElement;
      let ringBounds = analogRing.getBoundingClientRect();

      let touchPosition = {
        x: event.touches[touchIndex].clientX,
        y: event.touches[touchIndex].clientY
      };

      // normalize to X=[-1;1] (left-right) Y=[-1;1] (top-bottom)
      let normalizedX =
        2 * ((touchPosition.x - ringBounds.left) / ringBounds.width - 0.5);
      let normalizedY =
        2 * ((touchPosition.y - ringBounds.top) / ringBounds.height - 0.5);

      // normalize if longer than 1
      let vec2Length = Math.sqrt(
        Math.pow(normalizedX, 2) + Math.pow(normalizedY, 2)
      );
      if (vec2Length > 1) {
        normalizedX = normalizedX / vec2Length;
        normalizedY = normalizedY / vec2Length;
      }
      // invert Y for standard controller analog stick axes alignments
      normalizedY *= -1;

      return { x: normalizedX, y: normalizedY };
    },
    toggleFullScreen: function() {
      this.$refs['fullscreen'].toggle();
    },
    onFullScreenChange: function(fullscreen) {
      this.fullscreen = fullscreen;
    },
    calibrate: function() {
      if (this.deviceData.currentOrientation) {
        this.deviceData.calibratedOrientation = this.deviceData.currentOrientation;
      }
    }
  }
};
</script>

<style scoped>
.controller {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 30px repeat(2, 1fr);
  grid-template-areas:
    'debug-log debug-log debug-log debug-log debug-log button-fullscreen'
    'analog-left analog-left touch-area touch-area a-button a-button'
    'analog-left analog-left start-select start-select b-button b-button';

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

.whitespace {
  width: 100px;
  height: 100px;
}

.analog-left {
  grid-area: analog-left;
  width: 200px;
  height: 200px;
}

.analog-right {
  grid-area: analog-right;
  width: 200px;
  height: 200px;
}

.analog-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(grey, grey);
}

.analog-stick {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  box-shadow: 10px 10px black;
  background: radial-gradient(grey, black);
}

.start-select-area {
  grid-area: start-select;
  height: 100%;
  width: 100%;
  text-align: center;
}

.start-button {
  background: radial-gradient(white, grey);
  width: 100px;
  height: 50px;
  font-size: xx-large;
  margin-top: 5%;
}

.d-pad {
  grid-area: d-pad;
  background-color: green;
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

.a-button {
  grid-area: a-button;
  background: radial-gradient(green, green, white);
  box-shadow: 2px 2px grey;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  position: relative;
  font-size: xx-large;
  font-weight: bold;
}

.b-button {
  grid-area: b-button;
  background: radial-gradient(red, red, white);
  box-shadow: 2px 2px grey;
  border-radius: 50%;
  width: 100px;
  height: 100px;
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
</style>
