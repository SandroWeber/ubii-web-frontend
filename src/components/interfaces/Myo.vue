<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
        <span v-show="clientId">Client ID: {{clientId}}</span>
        <br>
          <button v-on:click="connectMyo()">Connect Myo</button>
          <br>
          <button v-on:click="getMyoData()">Get Myo Data</button>
          <br>
          <span>Gesture: {{myoGesture}}</span>
          <br>
          <span>EMG:</span>
          <span>
            {{this.round(myoEmg.v0, 1)}}
            {{this.round(myoEmg.v1, 1)}}
            {{this.round(myoEmg.v2, 1)}}
            {{this.round(myoEmg.v3, 1)}}
            {{this.round(myoEmg.v4, 1)}}
            {{this.round(myoEmg.v5, 1)}}
            {{this.round(myoEmg.v6, 1)}}
            {{this.round(myoEmg.v7, 1)}}
          </span>
          <br>
          <span>Orientation:</span>
          <span>
            {{this.round(myoOrientation.x, 1)}}
            {{this.round(myoOrientation.y, 1)}}
            {{this.round(myoOrientation.z, 1)}}
            {{this.round(myoOrientation.w, 1)}}
          </span>
          <br>
          <span>Gyroscope:</span>
          <span>
            {{this.round(myoRotation.x, 1)}}
            {{this.round(myoRotation.y, 1)}}
            {{this.round(myoRotation.z, 1)}}
          </span>
          <br>
          <span>Accelerometer:</span>
          <span>
            {{this.round(myoAcceleration.x, 1)}}
            {{this.round(myoAcceleration.y, 1)}}
            {{this.round(myoAcceleration.z, 1)}}            
          </span>
        </div>
  </UbiiClientContent>
</template>

<script>
import Myo from "myo";

import UbiiClientContent from "../applications/sharedModules/UbiiClientContent";
import UbiiClientService from "../../services/ubiiClient/ubiiClientService.js";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";
import UbiiEventBus from "../../services/ubiiClient/ubiiEventBus";

/* fontawesome */
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

library.add(faPlay);

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
      deviceIsConnected: false,
      myoEmg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
      myoOrientation: {x:0,y:0,z:0,w:0},
      myoRotation: {x:0,y:0,z:0},
      myoAcceleration: {x:0,y:0,z:0},
      myoGesture: ""
    };
  },
  computed:{
    updateAccX: function(){
      Myo.on("imu", function(data, timestep){
        return data.accelerometer.x;
      });
    }
  },
  methods: {
    getMyoData: function() {
      Myo.on("imu", (data, timestamp) => {
        this.$data.myoOrientation = {
          x:data.orientation.x,
          y:data.orientation.y,
          z:data.orientation.z,
          w:data.orientation.w
        };
        this.$data.myoRotation = {
          x:data.gyroscope .x,
          y:data.gyroscope .y,
          z:data.gyroscope .z
        };
        this.$data.myoAcceleration = {
          x:data.accelerometer.x,
          y:data.accelerometer.y,
          z:data.accelerometer.z
        };
      });
      Myo.on("emg", (data,timestep) => {
        this.$data.myoEmg = {
          v0:data[0],
          v1:data[1],
          v2:data[2],
          v3:data[3],
          v4:data[4],
          v5:data[5],
          v6:data[6],
          v7:data[7]
          }
      });
      Myo.on("pose", (data,timestep) => {
        this.$data.myoGesture = data;
      });
      Myo.on("pose_off", (data,timestemp) => {
        this.$data.myoGesture = "";
      })
    },
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
/*       this.$data.componentTouchPosition = ubiiDevice.components[0];
      this.$data.componentOrientation = ubiiDevice.components[1];
      this.$data.componentLinearAcceleration = ubiiDevice.components[2];
      this.$data.componentTouchEvents = ubiiDevice.components[3]; */
    },
    startInterface: function() {
      Myo.connect('com.ubii.myoInterface');
      console.log("connected");

      Myo.on("connected", function(data, timestamp) {
      console.log("Myo successfully connected. Data: " + JSON.stringify(data) + ". Timestamp: " + timestamp + ".");
      });
      
      // register the mouse pointer device
      UbiiClientService.isConnected().then(() => {


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
      });
    },
    stopInterface: function() {
      //Myo.streamEMG(false);
      Myo.disconnect();      
    },
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },
    connectMyo: function() {
        Myo.connect('com.ubii.myoInterface');

        Myo.on("connected", function(data, timestamp) {
        this.streamEMG(true);
        console.log("Myo successfully connected. Data: " + JSON.stringify(data) + ". Timestamp: " + timestamp + ".");
        });
        this.deviceIsConnected = Myo.connected;
        //Myo.streamEMG(true);
    }
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
