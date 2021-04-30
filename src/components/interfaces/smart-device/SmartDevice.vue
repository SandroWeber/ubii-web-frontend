<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <fullscreen ref="fullscreen" class="fullscreen" @change="onFullScreenChange" style="overflow: hidden;">
        <div class="content">
          <button class="button-debug" @click="showDebugView = !showDebugView">
            Debug View
          </button>

          <button class="button-calibrate" v-show="!fullscreen" @click="calibrate()">
            Calibrate
          </button>

          <button class="button-fullscreen" @click="toggleFullScreen()">
            <font-awesome-icon icon="compress" class="interface-icon" v-show="fullscreen" />
            <font-awesome-icon icon="expand" class="interface-icon" v-show="!fullscreen" />
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

import UbiiSmartDevice from './ubii-smart-device';

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
    this.initializing = false;
    this.hasRegisteredUbiiDevice = false;

    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', async () => {
      await this.stopInterface();
    });

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
  /*computed: {
    touch0X: function() {
      return (
        this.ubiiDevice.deviceData &&
        this.ubiiDevice.deviceData.touches &&
        this.ubiiDevice.deviceData.touches[0] &&
        this.round(this.ubiiDevice.deviceData.touches[0].clientX, 1)
      );
    }
  },*/
  methods: {
    startInterface: async function() {
      if (this.initializing) return;

      this.initializing = true;

      this.ubiiDevice = new UbiiSmartDevice();
      await this.ubiiDevice.init();

      this.intervalUpdateDebugView = setInterval(this.updateDebugView, 100);
    },
    stopInterface: async function() {
      this.ubiiDevice && (await this.ubiiDevice.deinit());
      this.intervalUpdateDebugView && clearInterval(this.intervalUpdateDebugView);
    },
    onTouchStart: function(event) {
      this.debugOutput = 'event onTouchStart';
      this.ubiiDevice.onTouchStart(event);
    },
    onTouchMove: function(event) {
      this.debugOutput = 'event onTouchMove';
      this.ubiiDevice.onTouchMove(event);
    },
    onTouchEnd: function(event) {
      this.debugOutput = 'event onTouchEnd';
      this.ubiiDevice.onTouchEnd(event);
    },
    /* helper methods */
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },
    toggleFullScreen: function() {
      this.$refs['fullscreen'].toggle();
    },
    onFullScreenChange: function(fullscreen) {
      this.fullscreen = fullscreen;
    },
    calibrate: function() {
      if (this.ubiiDevice.deviceData.currentOrientation) {
        this.ubiiDevice.deviceData.calibratedOrientation = this.ubiiDevice.deviceData.currentOrientation;
      }
    },
    /* GUI methods */
    getTouch0X: function() {
      return (
        this.ubiiDevice &&
        this.ubiiDevice.deviceData &&
        this.ubiiDevice.deviceData.touches &&
        this.ubiiDevice.deviceData.touches[0] &&
        this.round(this.ubiiDevice.deviceData.touches[0].clientX, 1)
      );
    },
    getTouch0Y: function() {
      return (
        this.ubiiDevice &&
        this.ubiiDevice.deviceData &&
        this.ubiiDevice.deviceData.touches &&
        this.ubiiDevice.deviceData.touches[0] &&
        this.round(this.ubiiDevice.deviceData.touches[0].clientY, 1)
      );
    },
    updateDebugView: function() {
      if (this.showDebugView) {
        let ubiiDeviceData = this.ubiiDevice && this.ubiiDevice.deviceData;

        if (ubiiDeviceData && ubiiDeviceData.currentOrientation) {
          this.debugDeviceOrientation = {
            alpha: this.round(ubiiDeviceData.currentOrientation.alpha, 2),
            beta: this.round(ubiiDeviceData.currentOrientation.beta, 2),
            gamma: this.round(ubiiDeviceData.currentOrientation.gamma, 2)
          };
          this.debugFixedCalibratedOrientation = {
            alpha: this.round(ubiiDeviceData.fixedCalibratedOrientation.alpha, 2),
            beta: this.round(ubiiDeviceData.fixedCalibratedOrientation.beta, 2),
            gamma: this.round(ubiiDeviceData.fixedCalibratedOrientation.gamma, 2)
          };
        }

        if (ubiiDeviceData && ubiiDeviceData.accelerationData) {
          this.debugAcceleration = {
            x: this.round(ubiiDeviceData.accelerationData.acceleration.x, 2),
            y: this.round(ubiiDeviceData.accelerationData.acceleration.y, 2),
            z: this.round(ubiiDeviceData.accelerationData.acceleration.z, 2)
          };
        }

        if (ubiiDeviceData && ubiiDeviceData.rotationRateData) {
          this.debugRotationRate = {
            alpha: this.round(ubiiDeviceData.rotationRateData.rotationRate.alpha, 2),
            beta: this.round(ubiiDeviceData.rotationRateData.rotationRate.beta, 2),
            gamma: this.round(ubiiDeviceData.rotationRateData.rotationRate.gamma, 2)
          };
        }
      }
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
