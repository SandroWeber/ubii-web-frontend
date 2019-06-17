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
        <br>

        <button @click="toggleFullScreen()">
          <span v-show="fullscreen">x</span>
          <span v-show="!fullscreen">Fullscreen Mode</span>
        </button>
        <br>
        <button v-show="!fullscreen" @click="calibrate()">Calibrate Orientation</button>

        <div
          id="touch-area"
          class="touch-area"
          v-on:touchstart="onTouchStart($event)"
          v-on:touchmove="onTouchMove($event)"
          v-on:touchend="onTouchEnd($event)"
        >
          <span>Touch0: {{touches && touches[0] && touches[0].clientX}} {{touches && touches[0] && touches[0].clientY}}</span>
          <br>
          <span>Device Orientation:</span>
          <span v-if="deviceOrientation">
            {{this.round(deviceOrientation.alpha, 1)}}
            {{this.round(deviceOrientation.beta, 1)}}
            {{this.round(deviceOrientation.gamma, 1)}}
          </span>
          <br>
          <span>Rotation Rate:</span>
          <span v-if="deviceMotion && deviceMotion.rotationRate">
            {{this.round(deviceMotion.rotationRate.alpha, 1)}}
            {{this.round(deviceMotion.rotationRate.beta, 1)}}
            {{this.round(deviceMotion.rotationRate.gamma, 1)}}
          </span>
          <br>
          <span>Acceleration:</span>
          <span v-if="deviceMotion && deviceMotion.acceleration">
            {{this.round(deviceMotion.acceleration.x, 1)}}
            {{this.round(deviceMotion.acceleration.y, 1)}}
            {{this.round(deviceMotion.acceleration.z, 1)}}
          </span>
          <br>
          <span>Acceleration including Gravity:</span>
          <span v-if="deviceMotion && deviceMotion.accelerationIncludingGravity">
            {{this.round(deviceMotion.accelerationIncludingGravity.x, 1)}}
            {{this.round(deviceMotion.accelerationIncludingGravity.y, 1)}}
            {{this.round(deviceMotion.accelerationIncludingGravity.z, 1)}}
          </span>
          <br>
          <span>Calibrated Rotation:</span>
          <span v-if="fixedCalibratedRotation">
            {{this.round(fixedCalibratedRotation.x, 1)}}
            {{this.round(fixedCalibratedRotation.y, 1)}}
            {{this.round(fixedCalibratedRotation.z, 1)}}
          </span>
        </div>
      </fullscreen>
    </div>
  </UbiiClientContent>
</template>

<script>
import Vue from "vue";
import Fullscreen from "vue-fullscreen";

import UbiiClientContent from "../applications/sharedModules/UbiiClientContent";
import UbiiClientService from "../../services/ubiiClient/ubiiClientService.js";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";
import UbiiEventBus from "../../services/ubiiClient/ubiiEventBus";

/* fontawesome */
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

library.add(faPlay);

Vue.use(Fullscreen);

/* eslint-disable no-console */

export default {
  name: "Interface-SmartDevice",
  components: { UbiiClientContent },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener("beforeunload", () => {
      this.stopInterface();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, this.startInterface);
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stopInterface);
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      clientId: undefined,
      touches: undefined,
      deviceOrientation: undefined,
      deviceMotion: undefined,
      fullscreen: false,
      currentRotation: undefined,
      calibratedRotation: { x: 0, y: 0, z: 0 },
      fixedCalibratedRotation: undefined
    };
  },
  methods: {
    createUbiiSpecs: function() {
      let deviceName = "web-interface-smart-device";

      this.clientId = UbiiClientService.getClientID();
      let topicPrefix = this.clientId + "/" + deviceName;

      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: topicPrefix + "/touch_position",
            messageFormat: "ubii.dataStructure.Vector2",
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + "/orientation",
            messageFormat: "ubii.dataStructure.Vector3",
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + "/linear_acceleration",
            messageFormat: "ubii.dataStructure.Vector3",
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + "/touch_events",
            messageFormat: "ubii.dataStructure.TouchEvent",
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + "/calibrated_rotation",
            messageFormat: "ubii.dataStructure.Vector3",
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          }
        ]
      };

      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.componentTouchPosition = ubiiDevice.components[0];
      this.$data.componentDeviceOrientation = ubiiDevice.components[1];
      this.$data.componentLinearAcceleration = ubiiDevice.components[2];
      this.$data.componentTouchEvents = ubiiDevice.components[3];
      this.$data.componentCalibratedRotation = ubiiDevice.components[3];
    },
    startInterface: function() {
      // register the mouse pointer device
      UbiiClientService.isConnected().then(() => {
        this.createUbiiSpecs();
        UbiiClientService.registerDevice(this.$data.ubiiDevice).then(device => {
          this.$data.ubiiDevice = device;
          return device;
        });

        window.addEventListener(
          "deviceorientation",
          this.onDeviceOrientation,
          true
        );
        window.addEventListener("devicemotion", this.onDeviceMotion, true);
      });
    },
    stopInterface: function() {},
    onTouchStart: function(event) {
      this.$data.touches = event.touches;

      let position = this.normalizeCoordinates(event, 0);
      this.publishTouchPosition(position);
      this.publishTouchEvent(
        ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN,
        position
      );
    },
    onTouchMove: function(event) {
      this.$data.touches = event.touches;

      let position = this.normalizeCoordinates(event, 0);
      this.publishTouchPosition(position);
    },
    onTouchEnd: function(event) {
      this.$data.touches = event.touches;

      this.publishTouchEvent(
        ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP,
        null
      );
    },
    onDeviceOrientation: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
      this.$data.deviceOrientation = event;

      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentDeviceOrientation.topic,
        "vector3",
        {
          x: this.round(event.alpha, 2),
          y: this.round(event.beta, 2),
          z: this.round(event.gamma, 2)
        }
      );
    },
    onDeviceMotion: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
      this.$data.deviceMotion = event;

      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentLinearAcceleration.topic,
        "vector3",
        {
          x: this.round(event.acceleration.x, 2),
          y: this.round(event.acceleration.y, 2),
          z: this.round(event.acceleration.z, 2)
        }
      );

      // calibrated rotation
      let current = (this.$data.currentRotation = {
        x: this.round(event.accelerationIncludingGravity.x, 2),
        y: this.round(event.accelerationIncludingGravity.y, 2),
        z: this.round(event.accelerationIncludingGravity.z, 2)
      });
      let calibrated = this.$data.calibratedRotation;

      let fixed = {
        x: current.x - calibrated.x,
        y: current.y - calibrated.y,
        z: current.z - calibrated.z
      };

      this.fixedCalibratedRotation = fixed;

      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentCalibratedRotation.topic,
        "vector3",
        {
          x: this.round(fixed.x, 2),
          y: this.round(fixed.z, 2),
          z: this.round(fixed.y, 2)
        }
      );
    },
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
    publishTouchPosition: function(position) {
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentTouchPosition.topic,
        "vector2",
        position
      );
    },
    publishTouchEvent: function(type, position) {
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentTouchEvents.topic,
        "touchEvent",
        { type: type, position: position }
      );
    },
    toggleFullScreen: function() {
      this.$refs["fullscreen"].toggle();
    },
    onFullScreenChange: function(fullscreen) {
      this.fullscreen = fullscreen;
    },
    calibrate: function() {
      if (this.currentRotation) {
        this.calibratedRotation = this.currentRotation;
      }
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
</style>
