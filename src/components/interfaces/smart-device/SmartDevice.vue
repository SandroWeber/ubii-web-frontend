<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div v-if="!enabled" class="wrapper-button-enable">
      <span>additional tags (comma separated):</span>
      <input id="add-tags" type="text" v-model="additionalTags" />
      <button @click="onClickEnable()">Enable</button>
    </div>
    <div v-else>
      <div class="debug-info">
        <div>Device ID: {{ clientId || 'Not registered' }}</div>
        <div>
          <div>GPS Location:</div>
          <div>Latitude: {{ deviceLocation.latitude ? deviceLocation.latitude.toFixed(6) : 'Waiting...' }}</div>
          <div>Longitude: {{ deviceLocation.longitude ? deviceLocation.longitude.toFixed(6) : 'Waiting...' }}</div>
          <div>Accuracy: {{ deviceLocation.accuracy ? deviceLocation.accuracy.toFixed(2) + 'm' : 'Waiting...' }}</div>
        </div>
        <div v-if="!isSecure && isIOS" class="protocol-warning">
          <p>⚠️ Running on HTTP - Geolocation may not work on iOS. Please use HTTPS.</p>
        </div>
        <div v-if="locationPermissionDenied" class="permission-warning">
          <p>Location permission is required for this device to work properly.</p>
          <button @click="requestLocationPermission" class="permission-button">
            Grant Location Permission
          </button>
        </div>
      </div>
      <div ref="top-div">
        <fullscreen ref="fullscreen" class="fullscreen" @change="onFullScreenChange" style="overflow: hidden">
          <div class="content">
            <button
              class="button-permissions"
              v-show="needsImuPermissions && !grantedImuPermission"
              @click="requestImuPermissions()"
            >
              IMU Permissions
            </button>

            <button class="button-debug" @click="showDebugView = !showDebugView">Debug</button>

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
                {{ round(debugAcceleration.x, 1) }}
                {{ round(debugAcceleration.y, 1) }}
                {{ round(debugAcceleration.z, 1) }}
              </span>
              <br />
              <span>Rotation:</span>
              <span v-if="debugRotationRate">
                {{ round(debugRotationRate.alpha, 1) }}
                {{ round(debugRotationRate.beta, 1) }}
                {{ round(debugRotationRate.gamma, 1) }}
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
      enabled: false,
      additionalTags: '',
      ubiiDevice: null,
      initializing: false,
      hasRegisteredUbiiDevice: false,
      locationPermissionDenied: false,
      deviceLocation: {
        latitude: null,
        longitude: null,
        accuracy: null
      },
      isSecure: window.location.protocol === 'https:',
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    };
  },
  mounted: async function() {
    this.initializing = false;
    this.hasRegisteredUbiiDevice = false;
    this.enabled = false;
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
    onClickEnable: async function() {
      this.enabled = true;

      UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, async () => {
        await this.startInterface();
      });
      UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, async () => {
        await this.stopInterface();
      });

      // unsubscribe before page is unloaded
      window.addEventListener('beforeunload', async () => {
        await this.stopInterface();
      });

      await this.startInterface();
    },
    startInterface: async function() {
      if (this.initializing) return;
      this.initializing = true;

      try {
        await UbiiClientService.instance.waitForConnection();
        this.clientId = UbiiClientService.instance.getClientID();
        console.log('Connected with client ID:', this.clientId);
      } catch (error) {
        console.error('waitForConnection error:', error);
        this.initializing = false;
        return;
      }

      try {
        this.elementTouch = document.getElementById('touch-area');
        this.ubiiDevice = new UbiiSmartDevice(this.elementTouch, {
          tags: this.additionalTags.split(',').filter(value => value.length > 0)
        });
      } catch (error) {
        console.error('ubii device creation error:', error);
        this.initializing = false;
        return;
      }

      try {
        const success = await this.ubiiDevice.init();
        if (!success) {
          console.error('Failed to initialize device');
          this.initializing = false;
          return;
        }

        // Subscribe to device location updates
        UbiiClientService.instance.subscribeTopic(
          `/${this.clientId}/web-interface-smart-device/gps_coordinates`,
          (data) => {
            if (data && data.vector2) {
              this.deviceLocation = {
                latitude: data.vector2.x,
                longitude: data.vector2.y,
                accuracy: data.vector2.accuracy || null
              };
            }
          }
        );

        this.intervalUpdateDebugView = setInterval(this.updateDebugView, 100);
      } catch (error) {
        console.error('ubii device init error:', error);
        this.initializing = false;
        return;
      }

      this.initializing = false;
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

        if (ubiiDeviceData && ubiiDeviceData.rotationRate) {
          this.debugRotationRate = {
            alpha: this.round(ubiiDeviceData.rotationRate.rotationRate.alpha, 2),
            beta: this.round(ubiiDeviceData.rotationRate.rotationRate.beta, 2),
            gamma: this.round(ubiiDeviceData.rotationRate.rotationRate.gamma, 2)
          };
        }
      }
    },
    async requestLocationPermission() {
      try {
        // First check if we're on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
          console.log('iOS detected - please enable location services in Settings');
          // For iOS, we need to try to get a position to trigger the system prompt
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('iOS location permission granted');
                this.locationPermissionDenied = false;
                resolve(position);
              },
              (error) => {
                console.error('iOS location permission error:', error);
                this.locationPermissionDenied = true;
                reject(error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          });
        } else {
          // For non-iOS devices, we can use the permissions API
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          console.log('Current permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'prompt') {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  console.log('Location permission granted');
                  this.locationPermissionDenied = false;
                  resolve(position);
                },
                (error) => {
                  console.error('Location permission error:', error);
                  this.locationPermissionDenied = true;
                  reject(error);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                }
              );
            });
          } else if (permissionStatus.state === 'denied') {
            console.log('Location permission denied - please enable in browser settings');
            this.locationPermissionDenied = true;
          }
        }
        
        // If we got here with permission, try to reinitialize the device
        if (!this.locationPermissionDenied) {
          await this.stopInterface();
          await this.startInterface();
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        this.locationPermissionDenied = true;
      }
    }
  }
};
</script>

<style scoped>
.debug-info {
  background-color: #f5f5f5;
  padding: 10px;
  margin: 10px;
  border-radius: 4px;
  font-family: monospace;
}

.wrapper-button-enable {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.fullscreen {
  width: 100%;
  height: 100%;
}

.content {
  width: 100%;
  height: 100%;
  position: relative;
}

.button-permissions {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.button-debug {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}

.button-calibrate {
  position: absolute;
  top: 0;
  right: 60px;
  z-index: 1;
}

.button-fullscreen {
  position: absolute;
  top: 0;
  right: 120px;
  z-index: 1;
}

.debug-view {
  position: absolute;
  top: 30px;
  right: 0;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px;
}

#touch-area {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  touch-action: none;
  user-select: none;
}

.permission-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.permission-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.permission-button:hover {
  background-color: #0056b3;
}

.protocol-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}
</style>
