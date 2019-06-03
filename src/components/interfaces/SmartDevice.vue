<template>
  <div ref="top-div">
    <fullscreen
      ref="fullscreen"
      class="fullscreen"
      @change="onFullScreenChange"
      style="overflow: hidden;"
    >
      <div v-show="!ubiiClientService.isConnected">
        <span class="notification">Please connect to backend before starting the application.</span>
      </div>

      <span v-show="clientId">Client ID: {{clientId}}</span>

      <button @click="toggleFullScreen()">Fullscreen Mode</button>

      <div
        id="touch-area"
        class="touch-area"
        v-on:touchstart="onTouchStart($event)"
        v-on:touchmove="onTouchMove($event)"
        v-on:touchend="onTouchEnd($event)"
      >
        <span>Touch0: {{touches && touches[0] && touches[0].clientX}} {{touches && touches[0] && touches[0].clientY}}</span>
        <br>
        <span>Orientation:</span>
        <span v-if="deviceOrientation">
          {{deviceOrientation.absolute}}
          {{this.round(deviceOrientation.alpha, 1)}}
          {{this.round(deviceOrientation.beta, 1)}}
          {{this.round(deviceOrientation.gamma, 1)}}
        </span>
        <br>
        <span>Acceleration:</span>
        <span v-if="deviceMotion && deviceMotion.acceleration">
          {{this.round(deviceMotion.acceleration.x, 1)}}
          {{this.round(deviceMotion.acceleration.y, 1)}}
          {{this.round(deviceMotion.acceleration.z, 1)}}
        </span>
        <br>
        <span>Rotation:</span>
        <span v-if="deviceMotion && deviceMotion.rotationRate">
          {{this.round(deviceMotion.rotationRate.alpha, 1)}}
          {{this.round(deviceMotion.rotationRate.beta, 1)}}
          {{this.round(deviceMotion.rotationRate.gamma, 1)}}
        </span>
      </div>
    </fullscreen>
  </div>
</template>

<script>
import Vue from "vue";
import Fullscreen from "vue-fullscreen";

import UbiiClientService from "../../services/ubiiClient/ubiiClientService.js";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";

/* fontawesome */
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

library.add(faPlay);

Vue.use(Fullscreen);

/* eslint-disable no-console */

export default {
  name: "Interface-SmartDevice",
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener("beforeunload", () => {
      this.stopInterface();
    });

    this.startInterface();
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
      fullscreen: false
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
          }
        ]
      };

      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.componentTouch = ubiiDevice.components[0];
      this.$data.componentOrientation = ubiiDevice.components[1];
      this.$data.componentLinearAcceleration = ubiiDevice.components[2];
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

      this.publishNormalizedTouch(event, 0);
    },
    onTouchMove: function(event) {
      this.$data.touches = event.touches;

      this.publishNormalizedTouch(event, 0);
    },
    onTouchEnd: function(event) {
      this.$data.touches = event.touches;

      this.publishNormalizedTouch(event, 0);
    },
    onDeviceOrientation: function(event) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
      this.$data.deviceOrientation = event;

      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentOrientation.topic,
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
    },
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },
    publishTouch: function(index, x, y) {
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentTouch.topic,
        "vector2",
        { x: x, y: y }
      );
    },
    publishNormalizedTouch: function(event, touchIndex) {
      let normalizedTouchX =
        (event.touches[touchIndex].clientX - event.target.offsetLeft) /
        event.target.offsetWidth;
      let normalizedTouchY =
        (event.touches[touchIndex].clientY - event.target.offsetTop) /
        event.target.offsetHeight;
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.componentTouch.topic,
        "vector2",
        { x: normalizedTouchX, y: normalizedTouchY }
      );
    },
    toggleFullScreen: function() {
      this.$refs["fullscreen"].toggle();
    },
    onFullScreenChange: function(fullscreen) {
      this.fullscreen = fullscreen;
    }
  }
};
</script>

<style scoped lang="stylus">
.touch-area, .fullscreen {
  height: 100%;
}

.notification {
  color: red;
}
</style>
