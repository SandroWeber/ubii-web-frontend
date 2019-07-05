<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <fullscreen
        ref="fullscreen"
        class="fullscreen"
        @change="onFullScreenChange"
        style="overflow: hidden;"
      >
        <span v-show="clientId">Client ID: {{clientId}}</span>
        <br />

        <button class="button-fullscreen" @click="toggleFullScreen()">
          <font-awesome-icon icon="compress" class="interface-icon" v-show="fullscreen" />
          <font-awesome-icon icon="expand" class="interface-icon" v-show="!fullscreen" />
        </button>
        <br />
        <button v-show="!fullscreen" @click="calibrate()">Calibrate</button>

        <div
          id="touch-area"
          class="touch-area"
          v-on:touchstart="onTouchStart($event)"
          v-on:touchmove="onTouchMove($event)"
          v-on:touchend="onTouchEnd($event)"
        >
          <!--<span>Touch0: {{getTouch0X()}} {{getTouch0Y()}}</span>
          <br>
          <span>Orientation:</span>
          <span v-if="deviceOrientation">
            {{this.round(deviceOrientation.alpha, 1)}}
            {{this.round(deviceOrientation.beta, 1)}}
            {{this.round(deviceOrientation.gamma, 1)}}
          </span>
          <br>
          <span>Calibrated Orientation:</span>
          <span v-if="fixedCalibratedOrientation">
            {{this.round(fixedCalibratedOrientation.x, 1)}}
            {{this.round(fixedCalibratedOrientation.y, 1)}}
            {{this.round(fixedCalibratedOrientation.z, 1)}}
          </span>
          <br>
          <span>Acceleration:</span>
          <span v-if="deviceData.accelerationTest">
            {{this.round(deviceData.acceleration.x, 1)}}
            {{this.round(deviceData.acceleration.y, 1)}}
            {{this.round(deviceData.acceleration.z, 1)}}
          </span>
          <br>
          <span>Rotation:</span>
          <span v-if="deviceData.rotationRate">
            {{this.round(deviceData.rotationRate.alpha, 1)}}
            {{this.round(deviceData.rotationRate.beta, 1)}}
            {{this.round(deviceData.rotationRate.gamma, 1)}}
          </span>-->
        </div>
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
      this.registerUbiiSpecs();
    });
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      initializing: false,
      hasRegisteredUbiiDevice: false,
      clientId: undefined,
      publishFrequency: 0.01,
      fullscreen: false
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

      let deviceName = 'web-interface-smart-device';

      this.clientId = UbiiClientService.getClientID();
      let topicPrefix = this.clientId + '/' + deviceName;

      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: topicPrefix + '/touch_position',
            messageFormat: 'ubii.dataStructure.Vector2',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
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
            topic: topicPrefix + '/touch_events',
            messageFormat: 'ubii.dataStructure.TouchEvent',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
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
        ubiiDevice.components.push({
          topic: topicPrefix + '/vibration_pattern',
          messageFormat: 'double',
          ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
        });
      }

      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.componentTouchPosition = ubiiDevice.components[0];
      this.$data.componentOrientation = ubiiDevice.components[1];
      this.$data.componentLinearAcceleration = ubiiDevice.components[2];
      this.$data.componentTouchEvents = ubiiDevice.components[3];
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
        this.createUbiiSpecs();
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then(device => {
            if (device.id) {
              this.$data.ubiiDevice = device;
              this.hasRegisteredUbiiDevice = true;
              this.initializing = false;
              this.publishContinuousDeviceData();
            }
            return device;
          })
          .then(() => {
            let vibrationComponent = this.$data.ubiiDevice.components.find(
              element => {
                return element.topic.indexOf('/vibration_pattern') !== -1;
              }
            );
            if (vibrationComponent) {
              UbiiClientService.client.subscribe(
                vibrationComponent.topic,
                vibrationPattern => {
                  navigator.vibrate(vibrationPattern);
                }
              );
            }
          });
      });
    },
    unregisterUbiiSpecs: function() {
      if (!this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to unregister ubii specs, but they are not registered.'
        );
        return;
      }

      if (this.$data.ubiiDevice && this.$data.ubiiDevice.components) {
        this.$data.ubiiDevice.components.forEach(component => {
          // eslint-disable-next-line no-console
          console.log('unsubscribed to ' + component.topic);

          UbiiClientService.client.unsubscribe(component.topic);
        });
      }

      this.hasRegisteredUbiiDevice = null;

      // TODO: unregister device
    },
    publishContinuousDeviceData: function() {
      this.deviceData.touchPosition &&
        this.publishTouchPosition(this.deviceData.touchPosition);

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
    publishTouchPosition: function(position) {
      if (this.hasRegisteredUbiiDevice) {
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.componentTouchPosition.topic,
          'vector2',
          position
        );
      }
    },
    publishTouchEvent: function(type, position) {
      if (this.hasRegisteredUbiiDevice) {
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.componentTouchEvents.topic,
          'touchEvent',
          { type: type, position: position }
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

      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentOrientation.topic,
        'vector3',
        fixed
      );
    },
    publishDeviceMotion: function(acceleration) {
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentLinearAcceleration.topic,
        'vector3',
        {
          x: this.round(acceleration.x, 2),
          y: this.round(acceleration.y, 2),
          z: this.round(acceleration.z, 2)
        }
      );
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

      this.deviceData.touchPosition = this.normalizeCoordinates(event, 0);
      this.publishTouchEvent(
        ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN,
        this.deviceData.touchPosition
      );
    },
    onTouchMove: function(event) {
      this.deviceData.touches = event.touches;

      this.deviceData.touchPosition = this.normalizeCoordinates(event, 0);
    },
    onTouchEnd: function(event) {
      this.deviceData.touches = event.touches;
      this.deviceData.touchPosition = undefined;

      this.publishTouchEvent(
        ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP,
        null
      );
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
    normalizeCoordinates: function(event, touchIndex) {
      let target = event.target;

      let touchPosition = {
        x: event.touches[touchIndex].clientX,
        y: event.touches[touchIndex].clientY
      };

      let normalizedX =
        (touchPosition.x - target.offsetLeft) / target.offsetWidth;
      let normalizedY =
        (touchPosition.y - target.offsetTop) / target.offsetHeight;

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
    },
    /* interface methods */
    getTouch0X: function() {
      //console.info(this.deviceData);
      return (
        this.deviceData &&
        this.deviceData.touches &&
        this.deviceData.touches[0] &&
        this.deviceData.touches[0].clientX
      );
    },

    getTouch0Y: function() {
      return (
        this.deviceData &&
        this.deviceData.touches &&
        this.deviceData.touches[0] &&
        this.deviceData.touches[0].clientY
      );
    }
  }
};
</script>

<style scoped lang="stylus">
.touch-area, .fullscreen {
  height: 100%;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.notification {
  color: red;
}

.button-fullscreen {
  width: 20px;
  height: 20px;
}
</style>
