<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div v-if="!enabled" class="wrapper-button-enable">
      <button @click="onClickEnable()">Enable</button>
    </div>
    <div ref="top-div" v-if="enabled">
      <fullscreen ref="fullscreen" class="fullscreen" @change="onFullScreenChange" style="overflow: hidden">
        <div class="content">
          <button
            class="button-safari-permissions"
            v-show="needsImuPermissions && !grantedImuPermission"
            @click="requestImuPermissions()"
          >
            IMU Permissions
          </button>

          <button class="button-debug" @click="showDebugView = !showDebugView">Debug View</button>

          <button class="button-calibrate" @click="calibrate()">Calibrate</button>

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
            <span v-if="!debugDeviceOrientation"> IMU data only available via HTTPS </span>
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

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';

import UbiiSmartDevice from './ubii-smart-device';

library.add([faExpand, faCompress]);

Vue.use(Fullscreen);

export default {
  name: 'Interface-SmartDevice',
  components: { UbiiClientContent },
  data: () => {
    return {
      ubiiClientService: UbiiClientService.instance,
      clientId: undefined,
      fullscreen: false,
      showDebugView: false,
      debugOutput: '... debug output ...',
      debugDeviceOrientation: undefined,
      debugFixedCalibratedOrientation: undefined,
      debugAcceleration: undefined,
      debugRotationRate: undefined,
      grantedImuPermission: false,
      enabled: false
    };
  },
  mounted: function() {
    this.initializing = false;
    this.hasRegisteredUbiiDevice = false;
    this.enabled = false;

    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', async () => {
      await this.stopInterface();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, async () => {
      await this.startInterface();
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, async () => {
      await this.stopInterface();
    });
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  computed: {
    needsImuPermissions: function() {
      return (
        typeof DeviceMotionEvent !== 'undefined' &&
        DeviceMotionEvent.requestPermission !== undefined &&
        typeof DeviceOrientationEvent !== 'undefined' &&
        DeviceOrientationEvent.requestPermission !== undefined
      );
    }
  },
  methods: {
    onClickEnable: function() {
      this.enabled = true;
      this.startInterface();
    },
    startInterface: async function() {
      if (this.initializing) return;
      this.initializing = true;

      try {
        await UbiiClientService.instance.waitForConnection();

        this.elementTouch = document.getElementById('touch-area');
        this.ubiiDevice = new UbiiSmartDevice(this.elementTouch);
        await this.ubiiDevice.init();
      } catch (error) {
        console.error(error);
      }

      this.intervalUpdateDebugView = setInterval(this.updateDebugView, 100);
    },
    stopInterface: async function() {
      this.ubiiDevice && (await this.ubiiDevice.deinit());
      this.intervalUpdateDebugView && clearInterval(this.intervalUpdateDebugView);
    },
    requestImuPermissions: async function() {
      let permissionDeviceMotion = 'denied',
        permissionDeviceOrientation = 'denied';

      permissionDeviceMotion = await DeviceMotionEvent.requestPermission();
      permissionDeviceOrientation = await DeviceOrientationEvent.requestPermission();

      if (permissionDeviceMotion === 'granted' && permissionDeviceOrientation === 'granted') {
        this.grantedImuPermission = true;
        this.ubiiDevice.registerEventListeners();
      }
    },
    onTouchStart: function(event) {
      this.debugOutput = 'event onTouchStart';
      this.ubiiDevice && this.ubiiDevice.componentTouch && this.ubiiDevice.componentTouch.onTouchStart(event);
    },
    onTouchMove: function(event) {
      this.debugOutput = 'event onTouchMove';
      this.ubiiDevice && this.ubiiDevice.componentTouch && this.ubiiDevice.componentTouch.onTouchMove(event);
    },
    onTouchEnd: function(event) {
      this.debugOutput = 'event onTouchEnd';
      this.ubiiDevice && this.ubiiDevice.componentTouch && this.ubiiDevice.componentTouch.onTouchEnd(event);
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
      this.ubiiDevice.componentOrientation && this.ubiiDevice.componentOrientation.calibrate();
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

        let componentOrientation = this.ubiiDevice && this.ubiiDevice.componentOrientation;
        if (componentOrientation) {
          if (componentOrientation.currentOrientation) {
            this.debugDeviceOrientation = {
              alpha: this.round(componentOrientation.currentOrientation.alpha, 2),
              beta: this.round(componentOrientation.currentOrientation.beta, 2),
              gamma: this.round(componentOrientation.currentOrientation.gamma, 2)
            };
          }
          if (componentOrientation.fixedCalibratedOrientation) {
            this.debugFixedCalibratedOrientation = {
              alpha: this.round(componentOrientation.fixedCalibratedOrientation.alpha, 2),
              beta: this.round(componentOrientation.fixedCalibratedOrientation.beta, 2),
              gamma: this.round(componentOrientation.fixedCalibratedOrientation.gamma, 2)
            };
          }
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
    'btn-safari-permissions btn-debug btn-calibrate btn-fullscreen'
    'debug-view debug-view debug-view debug-view'
    'touch touch touch touch';
}

.wrapper-button-enable {
  display: flex;
  justify-content: center;
  align-items: center;
}

.notification {
  color: red;
}

.button-safari-permissions {
  grid-area: btn-safari-permissions;
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
