<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <fullscreen
        ref="fullscreen"
        class="fullscreen"
        @change="onFullScreenChange"
        style="overflow: hidden;"
      >
        <div class="content">
          <button class="button-debug" @click="showDebugView = !showDebugView">
            Debug View
          </button>

          <button
            class="button-calibrate"
            v-show="!fullscreen"
            @click="calibrate()"
          >
            Calibrate
          </button>

          <button class="button-fullscreen" @click="toggleFullScreen()">
            <font-awesome-icon
              icon="compress"
              class="interface-icon"
              v-show="fullscreen"
            />
            <font-awesome-icon
              icon="expand"
              class="interface-icon"
              v-show="!fullscreen"
            />
          </button>

          <div id="debug-view" class="debug-view" v-show="showDebugView">
            <div id="debug-out">{{ debugOutput }}</div>
            <br />
            <span v-show="clientId">Client ID: {{ clientId }}</span>
            <br />
            <span>Touch0: {{ getTouch0X() }} {{ getTouch0Y() }}</span>
            <br />
            <span v-if="!debugDeviceOrientation">
              IMU data only available via HTTPS
            </span>
            <br />
            <span>Orientation:</span>
            <span v-if="debugDeviceOrientation">
              {{ debugDeviceOrientation.alpha }}
              {{ debugDeviceOrientation.beta }}
              {{ debugDeviceOrientation.gamma }}
            </span>
            <br />
            <span>Calibrated Orientation:</span>
            <span v-if="debugFixedCalibratedOrientation">
              {{ debugFixedCalibratedOrientation.alpha }}
              {{ debugFixedCalibratedOrientation.beta }}
              {{ debugFixedCalibratedOrientation.gamma }}
            </span>
            <br />
            <span>Acceleration:</span>
            <span v-if="debugAcceleration">
              {{ this.round(debugAcceleration.x, 1) }}
              {{ this.round(debugAcceleration.y, 1) }}
              {{ this.round(debugAcceleration.z, 1) }}
            </span>
            <br />
            <span>Rotation:</span>
            <span v-if="debugRotationRate">
              {{ this.round(debugRotationRate.alpha, 1) }}
              {{ this.round(debugRotationRate.beta, 1) }}
              {{ this.round(debugRotationRate.gamma, 1) }}
            </span>
          </div>

          <div
            id="touch-area"
            v-on:touchstart="onTouchStart($event)"
            v-on:touchmove="onTouchMove($event)"
            v-on:touchend="onTouchEnd($event)"
          ></div>
        </div>
      </fullscreen>
    </div>
  </UbiiClientContent>
</template>

<script>
import Vue from 'vue';
import Fullscreen from 'vue-fullscreen';

import UbiiClientContent from '../../applications/sharedModules/UbiiClientContent';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

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
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      clientId: undefined,
      fullscreen: false,
      showDebugView: false,
      debugOutput: '... debug output ...',
      debugDeviceOrientation: undefined,
      debugFixedCalibratedOrientation: undefined,
      debugAcceleration: undefined,
      debugRotationRate: undefined
    };
  },
  mounted: function() {
    this.deviceData = {};
    this.initializing = false;
    this.hasRegisteredUbiiDevice = false;
    this.publishFrequency = 0.02;

    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', async () => {
      await this.stopInterface();
    });

    this.registerEventListeners();
    UbiiClientService.waitForConnection().then(() => {
      this.startInterface();
    });
    UbiiClientService.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.startInterface();
    });
    UbiiClientService.onDisconnect(async () => {
      await this.stopInterface();
    });
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  computed: {
    touch0X: function() {
      return (
        this.deviceData &&
        this.deviceData.touches &&
        this.deviceData.touches[0] &&
        this.round(this.deviceData.touches[0].clientX, 1)
      );
    }
  },
  methods: {
    startInterface: function() {
      if (this.initializing) return;

      this.initializing = true;
      this.createUbiiSpecs();
      this.registerUbiiSpecs();
    },
    stopInterface: async function() {
      this.running = false;
      this.unregisterEventListeners();
      await this.unregisterUbiiSpecs();
    },
    /* ubii methods */
    createUbiiSpecs: function() {
      let deviceName = 'web-interface-smart-device';

      this.clientId = UbiiClientService.getClientID();
      let topicPrefix = this.clientId + '/' + deviceName;

      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        tags: ['smart device', 'web interface'],
        components: [
          {
            topic: topicPrefix + '/touch_position',
            messageFormat: 'ubii.dataStructure.Vector2',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: topicPrefix + '/orientation',
            messageFormat: 'ubii.dataStructure.Vector3',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: topicPrefix + '/linear_acceleration',
            messageFormat: 'ubii.dataStructure.Vector3',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: topicPrefix + '/touch_events',
            messageFormat: 'ubii.dataStructure.TouchEventList',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
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
          ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
        });
        this.tNextVibrate = Date.now();
        navigator.vibrate(100);
      }

      this.deviceName = deviceName;
      this.ubiiDevice = ubiiDevice;
      this.componentTouchPosition = ubiiDevice.components[0];
      this.componentOrientation = ubiiDevice.components[1];
      this.componentLinearAcceleration = ubiiDevice.components[2];
      this.componentTouchEvents = ubiiDevice.components[3];
    },
    registerUbiiSpecs: function() {
      if (this.ubiiDevice.id) {
        console.warn(
          'Tried to register ubii device, but is already registered'
        );
        document.getElementById('debug-out').innerHTML =
          'registerUbiiSpecs(), already registered';
        return;
      }

      // register the mouse pointer device
      UbiiClientService.waitForConnection().then(
        () => {
          UbiiClientService.registerDevice(this.ubiiDevice)
            .then(device => {
              if (device.id) {
                this.ubiiDevice = device;
                this.hasRegisteredUbiiDevice = true;
                this.initializing = false;
                this.running = true;
                this.publishContinuousDeviceData();
              }
              return device;
            })
            .then(() => {
              let vibrationComponent = this.ubiiDevice.components.find(
                element => {
                  return element.topic.indexOf('/vibration_pattern') !== -1;
                }
              );
              if (vibrationComponent) {
                UbiiClientService.subscribeTopic(
                  vibrationComponent.topic,
                  this.handleVibrationPattern
                );
              }
            });
        },
        // reject
        () => {
          this.initializing = false;
        }
      );
    },
    unregisterUbiiSpecs: function() {
      if (!this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to unregister ubii specs, but they are not registered.'
        );
        document.getElementById('debug-out').innerHTML =
          'unregister(), not registered';
        return;
      }

      if (this.ubiiDevice && this.ubiiDevice.components) {
        let vibrationComponent = this.ubiiDevice.components.find(element => {
          return element.topic.indexOf('/vibration_pattern') !== -1;
        });
        if (vibrationComponent) {
          UbiiClientService.unsubscribeTopic(
            vibrationComponent.topic,
            this.handleVibrationPattern
          );
        }

        return UbiiClientService.deregisterDevice(this.ubiiDevice).then(() => {
          this.hasRegisteredUbiiDevice = false;
        });
      }
    },
    publishContinuousDeviceData: function() {
      if (!this.running) {
        return;
      }

      this.deviceData.touchPosition &&
        this.publishTouchPosition(this.deviceData.touchPosition);

      this.deviceData.currentOrientation && this.publishDeviceOrientation();

      this.publishDeviceMotion();

      // call loop
      setTimeout(
        this.publishContinuousDeviceData,
        this.publishFrequency * 1000
      );
    },
    publishTouchPosition: function(position) {
      if (this.hasRegisteredUbiiDevice) {
        UbiiClientService.publish({
          topicDataRecord: {
            topic: this.componentTouchPosition.topic,
            vector2: position
          }
        });
      }
    },
    publishTouchEvent: function(type, position) {
      if (this.hasRegisteredUbiiDevice) {
        UbiiClientService.publish({
          topicDataRecord: {
            topic: this.componentTouchEvents.topic,
            touchEvent: { type: type, position: position }
          }
        });
      }
    },
    publishTouchEventList: function(touches) {
      if (this.hasRegisteredUbiiDevice) {
        UbiiClientService.publish({
          topicDataRecord: {
            topic: this.componentTouchEvents.topic,
            touchEventList: { elements: touches }
          }
        });
      }
    },
    publishDeviceOrientation: function() {
      if (!this.deviceData.currentOrientation) {
        return;
      }

      let calibrated = this.deviceData.calibratedOrientation || {
        alpha: 0,
        beta: 0,
        gamma: 0
      };

      this.deviceData.fixedCalibratedOrientation = {
        alpha: this.deviceData.currentOrientation.alpha - calibrated.alpha,
        beta: this.deviceData.currentOrientation.beta - calibrated.beta,
        gamma: this.deviceData.currentOrientation.gamma - calibrated.gamma
      };

      if (this.showDebugView) {
        this.debugDeviceOrientation = {
          alpha: this.round(this.deviceData.currentOrientation.alpha, 2),
          beta: this.round(this.deviceData.currentOrientation.beta, 2),
          gamma: this.round(this.deviceData.currentOrientation.gamma, 2)
        };
        this.debugFixedCalibratedOrientation = {
          alpha: this.round(
            this.deviceData.fixedCalibratedOrientation.alpha,
            2
          ),
          beta: this.round(this.deviceData.fixedCalibratedOrientation.beta, 2),
          gamma: this.round(this.deviceData.fixedCalibratedOrientation.gamma, 2)
        };
      }

      UbiiClientService.publish({
        topicDataRecord: {
          topic: this.componentOrientation.topic,
          vector3: {
            x: this.deviceData.fixedCalibratedOrientation.alpha,
            y: this.deviceData.fixedCalibratedOrientation.beta,
            z: this.deviceData.fixedCalibratedOrientation.gamma
          }
        }
      });
    },
    publishDeviceMotion: function() {
      if (!this.deviceData.accelerationData) {
        return;
      }

      if (this.showDebugView) {
        this.debugAcceleration = {
          x: this.round(this.deviceData.accelerationData.acceleration.x, 2),
          y: this.round(this.deviceData.accelerationData.acceleration.y, 2),
          z: this.round(this.deviceData.accelerationData.acceleration.z, 2)
        };
        if (this.deviceData.rotationRateData) {
          this.debugRotationRate = {
            alpha: this.round(
              this.deviceData.rotationRateData.rotationRate.alpha,
              2
            ),
            beta: this.round(
              this.deviceData.rotationRateData.rotationRate.beta,
              2
            ),
            gamma: this.round(
              this.deviceData.rotationRateData.rotationRate.gamma,
              2
            )
          };
        }
      }

      UbiiClientService.publish({
        topicDataRecord: {
          topic: this.componentLinearAcceleration.topic,
          timestamp: this.deviceData.accelerationData.timestamp,
          vector3: {
            x: this.deviceData.accelerationData.acceleration.x,
            y: this.deviceData.accelerationData.acceleration.y,
            z: this.deviceData.accelerationData.acceleration.z
          }
        }
      });
    },
    handleVibrationPattern: function(vibrationPattern) {
      if (Date.now() >= this.tNextVibrate) {
        navigator.vibrate(vibrationPattern);
        this.tNextVibrate = Date.now() + 2 * vibrationPattern;
      }
    },
    /* event callbacks */
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
      this.debugOutput = 'event onTouchStart';
      this.deviceData.touches = event.touches;
      /*console.info('touch start');
      console.info(event.touches);*/

      /*this.deviceData.touchPosition = this.normalizeCoordinates(event, 0);
      this.publishTouchEvent(
        ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN,
        this.deviceData.touchPosition
      );*/

      /*console.info('onTouchStart');
      console.info(event.touches);*/
      let touchList = [];
      for (let i = 0; i < event.touches.length; i++) {
        touchList.push({
          id: event.touches[i].identifier.toString(),
          type: ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN,
          position: this.normalizeCoordinates(event, i)
        });
      }
      //console.info(touchList);
      this.publishTouchEventList(touchList);
    },
    onTouchMove: function(event) {
      this.debugOutput = 'event onTouchMove';
      this.deviceData.touches = event.touches;
      /*console.info('touch move');
      console.info(event.touches);*/

      this.deviceData.touchPosition = this.normalizeCoordinates(event, 0);
    },
    onTouchEnd: function(event) {
      this.debugOutput = 'event onTouchEnd';
      this.deviceData.touches = event.touches;
      this.deviceData.touchPosition = undefined;
      /*console.info('touch end');
      console.info(event.touches);*/

      /*this.publishTouchEvent(
        ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP,
        null
      );*/

      /*console.info('onTouchEnd');
      console.info(event.touches);*/
      let touchList = [];
      for (let i = 0; i < event.touches.length; i++) {
        touchList.push({
          id: event.touches[i].identifier.toString(),
          type: ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP,
          position: this.normalizeCoordinates(event, i)
        });
      }
      //console.info(touchList);
      this.publishTouchEventList(touchList);
    },
    onDeviceOrientation: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
      this.deviceData.currentOrientation = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma
      };
    },
    onDeviceMotion: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
      let timestamp = UbiiClientService.generateTimestamp();
      this.deviceData.accelerationData = {
        acceleration: event.acceleration,
        timestamp: timestamp
      };
      this.deviceData.rotationRateData = {
        rotationRate: event.rotationRate,
        timestamp: timestamp
      };
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
    /* GUI methods */
    getTouch0X: function() {
      return (
        this.deviceData &&
        this.deviceData.touches &&
        this.deviceData.touches[0] &&
        this.round(this.deviceData.touches[0].clientX, 1)
      );
    },

    getTouch0Y: function() {
      return (
        this.deviceData &&
        this.deviceData.touches &&
        this.deviceData.touches[0] &&
        this.round(this.deviceData.touches[0].clientY, 1)
      );
    }
  }
};
</script>

<style scoped>
.fullscreen {
  height: 100%;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.content {
  height: 100%;
  display: grid;
  grid-gap: 5px;
  grid-template-columns: auto 100px 75px 25px;
  grid-template-rows: 25px auto 1fr;
  grid-template-areas:
    '. btn-debug btn-calibrate btn-fullscreen'
    'debug-view debug-view debug-view debug-view'
    'touch touch touch touch';
}

.notification {
  color: red;
}

.button-debug {
  grid-area: btn-debug;
}

.button-fullscreen {
  grid-area: btn-fullscreen;
  width: 25px;
  height: 25px;
}

.button-calibrate {
  grid-area: btn-calibrate;
}

.debug-view {
  grid-area: debug-view;
}

#touch-area {
  grid-area: touch;
  height: 100%;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
