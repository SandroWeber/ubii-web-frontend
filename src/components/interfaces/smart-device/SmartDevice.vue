<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div v-if="!enabled" class="wrapper-button-enable">
      <span>additional tags (comma separated):</span>
      <input id="add-tags" type="text" v-model="additionalTags" />
      <button @click="onClickEnable()">Enable</button>
    </div>
    <div ref="top-div" v-if="enabled">
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

          <button 
            class="button-location" 
            v-show="needsLocationPermission && !locationPermissionGranted"
            @click="requestLocationPermission()"
          >
            Location Permission
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
            <br />
            <span>GPS Location:</span>
            <span v-if="gpsStatus">
              {{ gpsStatus.latitude ? gpsStatus.latitude.toFixed(6) : 'Waiting...' }}
              {{ gpsStatus.longitude ? gpsStatus.longitude.toFixed(6) : 'Waiting...' }}
              ({{ gpsStatus.accuracy ? gpsStatus.accuracy.toFixed(2) + 'm' : 'N/A' }})
            </span>
            <br />
            <span v-if="!isSecure && isIOS" class="protocol-warning">
              ⚠️ Running on HTTP - Geolocation may not work on iOS. Please use HTTPS.
            </span>
            <br />
            <hr />
            <h4>🔒 Proximity Security Test</h4>
            <div class="proximity-test">
              <input 
                v-model="targetDeviceId" 
                placeholder="Target Device ID" 
                class="proximity-input"
              />
              <input 
                v-model.number="maxDistance" 
                type="number" 
                placeholder="Max Distance (m)" 
                class="proximity-input"
              />
              <button @click="testProximity()" class="proximity-button">Test Proximity</button>
              <div v-if="proximityResult" class="proximity-result">
                <span v-if="proximityResult.isWithinProximity" class="proximity-allowed">✅ Access ALLOWED</span>
                <span v-else class="proximity-denied">❌ Access DENIED</span>
                <br />
                <span>Distance: {{ proximityResult.distance.toFixed(2) }}m / {{ proximityResult.maxDistance }}m</span>
              </div>
            </div>
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
      locationPermissionGranted: false,
      gpsStatus: {
        latitude: null,
        longitude: null,
        accuracy: null
      },
      enabled: false,
      additionalTags: '',
      isSecure: window.location.protocol === 'https:',
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
      targetDeviceId: '',
      maxDistance: 100,
      proximityResult: null
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
    },
    needsLocationPermission: function() {
      return 'geolocation' in navigator;
    }
  },
  methods: {
    onClickEnable: function() {
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

      this.startInterface();
    },
    startInterface: async function() {
      if (this.initializing) return;
      this.initializing = true;

      try {
        await UbiiClientService.instance.waitForConnection();
      } catch (error) {
        console.error('waitForConnection error');
        console.error(error);
      }
      try {
        this.elementTouch = document.getElementById('touch-area');
        this.ubiiDevice = new UbiiSmartDevice(this.elementTouch, {
          tags: this.additionalTags.split(',').filter(value => value.length > 0)
        });
      } catch (error) {
        console.error('ubii device creation error');
        console.error(error);
      }
      try {
        await this.ubiiDevice.init();
        
        // Subscribe to GPS updates
        if (this.ubiiDevice.componentGPS) {
          UbiiClientService.instance.subscribeTopic(
            this.ubiiDevice.componentGPS.topic,
            (data) => {
              if (data && data.vector2) {
                this.gpsStatus = {
                  latitude: data.vector2.x,
                  longitude: data.vector2.y,
                  accuracy: data.vector2.accuracy || null
                };
              }
            }
          );
        }
      } catch (error) {
        console.error('ubii device init error');
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
    requestLocationPermission: async function() {
      try {
        if (this.isIOS) {
          console.log('iOS detected - please enable location services in Settings');
          // For iOS, we need to try to get a position to trigger the system prompt
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('iOS location permission granted');
                this.locationPermissionGranted = true;
                resolve(position);
              },
              (error) => {
                console.error('iOS location permission error:', error);
                this.locationPermissionGranted = false;
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
                  this.locationPermissionGranted = true;
                  resolve(position);
                },
                (error) => {
                  console.error('Location permission error:', error);
                  this.locationPermissionGranted = false;
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
            this.locationPermissionGranted = false;
          }
        }
        
        // If we got here with permission, try to reinitialize the device
        if (this.locationPermissionGranted) {
          await this.stopInterface();
          await this.startInterface();
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        this.locationPermissionGranted = false;
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

        // Update GPS status from component
        if (this.ubiiDevice && this.ubiiDevice.componentGPS) {
          const gpsStatus = this.ubiiDevice.componentGPS.getStatus();
          if (gpsStatus.isActive && this.gpsStatus.latitude === null) {
            // GPS is active but we don't have coordinates yet
            this.gpsStatus = {
              latitude: null,
              longitude: null,
              accuracy: null
            };
          }
        }
      }
    },
    testProximity: async function() {
      if (!this.ubiiDevice || !this.ubiiDevice.componentProximity) {
        console.error('Proximity component not available');
        return;
      }

      if (!this.targetDeviceId) {
        console.error('Please enter a target device ID');
        return;
      }

      try {
        const result = await this.ubiiDevice.componentProximity.checkProximity(
          this.targetDeviceId, 
          this.maxDistance
        );
        
        if (result) {
          this.proximityResult = result;
          console.log('Proximity test completed:', result);
        } else {
          console.error('Proximity test failed');
        }
      } catch (error) {
        console.error('Error testing proximity:', error);
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
  grid-template-columns: 25px 75px 75px auto;
  grid-template-rows: 25px auto 1fr;
  grid-template-areas:
    ' btn-fullscreen btn-debug btn-calibrate btn-permissions btn-location'
    'debug-view debug-view debug-view debug-view debug-view'
    'touch touch touch touch touch';
}

.wrapper-button-enable {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.notification {
  color: red;
}

.button-permissions {
  grid-area: btn-permissions;
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

.button-location {
  grid-area: btn-location;
}

.debug-view {
  grid-area: debug-view;
}

.protocol-warning {
  color: #ff6b35;
  font-weight: bold;
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

.proximity-test {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.proximity-input {
  margin: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  width: 150px;
}

.proximity-button {
  margin: 5px;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.proximity-button:hover {
  background-color: #0056b3;
}

.proximity-result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 3px;
  font-weight: bold;
}

.proximity-allowed {
  color: #28a745;
}

.proximity-denied {
  color: #dc3545;
}
</style>
