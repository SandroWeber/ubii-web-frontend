<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
        <span v-show="clientId">Client ID: {{clientId}}</span>
        <br>
          <span>Myo is connected: {{deviceIsConnected}}</span>
          <br>
          <span>Gesture: {{touches && touches[0] && touches[0].clientX}} {{touches && touches[0] && touches[0].clientY}}</span>
          <br>
          <span>EMG:</span>
          <span v-if="deviceEmg">
            {{this.round(deviceEmg.v0, 1)}}
            {{this.round(deviceEmg.v1, 1)}}
            {{this.round(deviceEmg.v2, 1)}}
            {{this.round(deviceEmg.v3, 1)}}
            {{this.round(deviceEmg.v4, 1)}}
            {{this.round(deviceEmg.v5, 1)}}
            {{this.round(deviceEmg.v6, 1)}}
            {{this.round(deviceEmg.v7, 1)}}
          </span>
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
  </UbiiClientContent>
</template>

<script>
import Vue from "vue";
import Myo from "myo";
//import Fullscreen from "vue-fullscreen";

import UbiiClientContent from "../applications/sharedModules/UbiiClientContent";
import UbiiClientService from "../../services/ubiiClient/ubiiClientService.js";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";
import UbiiEventBus from "../../services/ubiiClient/ubiiEventBus";

/* fontawesome */
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

library.add(faPlay);

//Vue.use(Fullscreen);

/* eslint-disable no-console */

export default {
  name: "Interface-Myo",
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
      deviceIsConnected: undefined,
      deviceEmg: undefined,
      deviceOrientation: undefined,
      deviceMotion: undefined,
      deviceGesture: undefined
    };
  },
  methods: {
    createUbiiSpecs: function() {
      let deviceName = "web-interface-myo";

      this.clientId = UbiiClientService.getClientID();
      let topicPrefix = this.clientId + "/" + deviceName;
    
      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: topicPrefix + "/myo_event",
            messageFormat: "ubii.dataStructure.myoEvent",
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          }
        ]
      };

      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.componentTouchPosition = ubiiDevice.components[0];
      this.$data.componentOrientation = ubiiDevice.components[1];
      this.$data.componentLinearAcceleration = ubiiDevice.components[2];
      this.$data.componentTouchEvents = ubiiDevice.components[3];
    },
    startInterface: function() {
      // register the mouse pointer device
      UbiiClientService.isConnected().then(() => {

        Myo.connect('com.stolksdorf.myAwesomeApp');

        Myo.on('fist', function(){
	        console.log('Hello Myo!');
	        this.vibrate();
        });

        // create all the specifications we need to define our example application
        // these are protobuf messages to be sent to the server (saved in this.$data)
        this.createUbiiSpecs();

        // register the device
        UbiiClientService.registerDevice(this.$data.ubiiDevice).then(device => {
          // on success, the response will be the (possibly extended) device specification we just sent
          // we accept any additions the server might have made, like an ID that was left blank so the backend
          // would automatically assign one, to our local state
          this.$data.ubiiDevice = device;
          return device;
        })
        .then(() => {
            // subscribe to the device topics so we are notified when new data arrives on the topic
            UbiiClientService.client.subscribe(
              this.$data.outputServerPointer.topic,
              // a callback to be called when new data on this topic arrives
              mousePosition => {
                // when we get a normalized server pointer position, we calculate back to absolute (x,y) within the
                // interaction area and set our red square indicator
                let boundingRect = document
                  .getElementById('mouse-pointer-area')
                  .getBoundingClientRect();
                this.$data.serverMousePosition = {
                  x: mousePosition.x * boundingRect.width,
                  y: mousePosition.y * boundingRect.height
                };
              }
            );

            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(() => {
                this.$data.exampleStarted = true;
              });
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
  }
};
</script>

<style scoped lang="stylus">
.touch-area {
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
