<template>
  <div ref="top-div">
    <div v-show="!ubiiClientService.isConnected">
      <span class="notification">
        Please connect to backend before starting the application.
      </span>
    </div>

    <div
        id="touch-area"
        class="touch-area"
        v-on:touchstart="onTouchStart($event)"
        v-on:touchmove="onTouchMove($event)"
        v-on:touchend="onTouchEnd($event)"
      >
      <span>Touch0: {{touches && touches[0] && touches[0].clientX}} {{touches && touches[0] && touches[0].clientY}}</span>
      <br />
      <span>Orientation:
      {{deviceOrientation.absolute}}
      {{this.round(deviceOrientation.alpha, 1)}}
      {{this.round(deviceOrientation.beta, 1)}}
      {{this.round(deviceOrientation.gamma, 1)}}</span>
      <br />
      <span>Acceleration: </span>
      <span v-if="deviceMotion.acceleration">
        {{this.round(deviceMotion.acceleration.x, 1)}}
        {{this.round(deviceMotion.acceleration.y, 1)}}
        {{this.round(deviceMotion.acceleration.z, 1)}}</span>
      <br />
      <span>Rotation: </span>
      <span v-if="deviceMotion.rotationRate">
        {{this.round(deviceMotion.rotationRate.alpha, 1)}}
        {{this.round(deviceMotion.rotationRate.beta, 1)}}
        {{this.round(deviceMotion.rotationRate.gamma, 1)}}</span>
    </div>
  </div>
</template>

<script>
  import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

  /* fontawesome */
  import {library} from '@fortawesome/fontawesome-svg-core'
  import {faPlay} from '@fortawesome/free-solid-svg-icons'

  library.add(faPlay);

  /* eslint-disable no-console */

  export default {
    name: 'Interface-SmartDevice',
    mounted: function() {
      // unsubscribe before page is unloaded
      window.addEventListener('beforeunload', () => {
        this.stopInterface();
      });

      this.startInterface();

      round
    },
    beforeDestroy: function() {
      this.stopInterface();
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService,
        touches: undefined,
        deviceOrientation: undefined,
        deviceMotion: undefined
      }
    },
    methods: {
      createUbiiSpecs: function () {
        let deviceName = 'web-interface-smart-device';

        let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;

        let componentTouch = {
          messageFormat: 'ubii.dataStructure.Vector2',
          topic: topicPrefix + '/' + 'touch_position'
        };
        let componentIMU = {
          messageFormat: 'ubii.dataStructure.IMU',
          topic: topicPrefix + '/' + 'imu'
        };

        let ubiiDevice = {
          name: deviceName,
          deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
          components: [
            {
              topic: componentTouch.topic,
              messageFormat: componentTouch.messageFormat,
              ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
            },
            {
              topic: componentIMU.topic,
              messageFormat: componentIMU.messageFormat,
              ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
            }
          ]
        };

        this.$data.deviceName = deviceName;
        this.$data.ubiiDevice = ubiiDevice;
      },
      startInterface: function () {
        this.createUbiiSpecs();

        window.addEventListener('deviceorientation', this.onDeviceOrientation, true);
        window.addEventListener('devicemotion', this.onDeviceMotion, true);

        // register the mouse pointer device
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then((device) => {
            this.$data.ubiiDevice = device;
            return device;
          });
      },
      stopInterface: function() {},
      onTouchStart: function (event) {
        this.$data.touches = event.touches;
        console.info('onTouchStart');
      },
      onTouchMove: function (event) {
        this.$data.touches = event.touches;
        console.info('onTouchMove');
      },
      onTouchEnd: function (event) {
        this.$data.touches = event.touches;
        console.info('onTouchEnd');
      },
      onDeviceOrientation: function(event) {
        this.$data.deviceOrientation = event;
      },
      onDeviceMotion: function(event) {
        this.$data.deviceMotion = event;
      },
      round: function(value, digits) {
        return Math.round(value * digits * 10) / (digits * 10);
      }
    }
  }
</script>

<style scoped lang="stylus">
    .touch-area
        height: 100%

    .notification
        color: red
</style>
