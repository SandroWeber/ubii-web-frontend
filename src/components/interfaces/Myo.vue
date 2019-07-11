
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
          <br>
          <span>Server-Gesture: {{serverMyoData.gesture}}</span>
          <br>
          <span>Server-EMG:</span>
          <span>
            {{this.round(serverMyoData.emg.v0, 1)}}
            {{this.round(serverMyoData.emg.v1, 1)}}
            {{this.round(serverMyoData.emg.v2, 1)}}
            {{this.round(serverMyoData.emg.v3, 1)}}
            {{this.round(serverMyoData.emg.v4, 1)}}
            {{this.round(serverMyoData.emg.v5, 1)}}
            {{this.round(serverMyoData.emg.v6, 1)}}
            {{this.round(serverMyoData.emg.v7, 1)}}
          </span>
          <br>
          <span>Server-Orientation:</span>
          <span>
            {{this.round(serverMyoData.orientation.x, 1)}}
            {{this.round(serverMyoData.orientation.y, 1)}}
            {{this.round(serverMyoData.orientation.z, 1)}}
            {{this.round(serverMyoData.orientation.w, 1)}}
          </span>
          <br>
          <span>Server-Gyroscope:</span>
          <span>
            {{this.round(serverMyoData.gyroscope.x, 1)}}
            {{this.round(serverMyoData.gyroscope.y, 1)}}
            {{this.round(serverMyoData.gyroscope.z, 1)}}
          </span>
          <br>
          <span>Server-Accelerometer:</span>
          <span>
            {{this.round(serverMyoData.accelerometer.x, 1)}}
            {{this.round(serverMyoData.accelerometer.y, 1)}}
            {{this.round(serverMyoData.accelerometer.z, 1)}}            
          </span>

        </div>
  </UbiiClientContent>
</template>

<script>
import Myo from "myo";

import UbiiClientContent from "../applications/sharedModules/UbiiClientContent";
import UbiiEventBus from "../../services/ubiiClient/ubiiEventBus";

import uuidv4 from 'uuid/v4';
import UbiiClientService from "../../services/ubiiClient/ubiiClientService.js";
import ProtobufLibrary from "@tum-far/ubii-msg-formats/dist/js/protobuf";
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

/* eslint-disable no-console */

export default {
  name: "Interface-Myo",
  components: { UbiiClientContent },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener("beforeunload", () => {
      this.stopInterface();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.startInterface();
      this.stopInterface();
    });
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stopInterface);

    if (UbiiClientService.isConnected) this.startInterface();
  },
  beforeDestroy: function() {
    this.stopInterface();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      deviceIsConnected: false,
      myoEmg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
      myoOrientation: {x:0,y:0,z:0,w:0},
      myoRotation: {x:0,y:0,z:0},
      myoAcceleration: {x:0,y:0,z:0},
      myoGesture: "",
      interfaceStarted: false,
      serverMyoEmg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},

      serverMyoData: {
        emg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
        orientation: {x:0,y:0,z:0,w:0},
        gyroscope: {x:0,y:0,z:0},
        accelerometer: {x:0,y:0,z:0},
        gesture: ""
      },

      clientMyoData: {
        emg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
        orientation: {x:0,y:0,z:0,w:0},
        gyroscope: {x:0,y:0,z:0},
        accelerometer: {x:0,y:0,z:0},
        gesture: ""
      }
    };
  },
  computed:{
  },
  watch:{
    //something something publish on change?
  },
  methods: {

    //ubii methods
    createUbiiSpecs: function() {
      //create specifications for the protobuff messages

      //helper definitions that we can reference later
      let deviceName = "web-interface-myo";
      this.clientId = UbiiClientService.getClientID();
      let topicPrefix = this.clientId + "/" + deviceName;

      let inputClientMyoData = {
        internalName: 'clientMyoData',
        messageFormat: 'ubii.dataStructure.MyoEvent',
        topic: topicPrefix + '/' + 'myo_client_data'
      };
      let outputServerMyoData = {
        internalName: 'serverMyoData',
        messageFormat: 'ubii.dataStructure.MyoEvent',
        topic: topicPrefix + '/' + 'myo_server_data'
      };
    
      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: inputClientMyoData.topic,
            messageFormat: inputClientMyoData.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: outputServerMyoData.topic,
            messageFormat: outputServerMyoData.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };

      // specification of a ubii.interactions.Interaction
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/interactions/interaction.proto
      let processingCallback = (input, output) => {
        if (!input.clientMyoData) {
          return;
        }
        output.serverMyoData = {
          emg:          input.clientMyoData.emg,
          orientation:  input.clientMyoData.orientation,
          gyroscope:    input.clientMyoData.gyroscope,
          accelerometer:input.clientMyoData.accelerometer,
          gesture:      input.clientMyoData.gesture 
        };  
      };      

      let ubiiInteraction = {
        id: uuidv4(),
        name: 'myo-interaction',
        processingCallback: processingCallback.toString(),
        inputFormats: [
          {
            internalName: inputClientMyoData.internalName,
            messageFormat: inputClientMyoData.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: outputServerMyoData.internalName,
            messageFormat: outputServerMyoData.messageFormat
          }
        ]
      };
      // specification of a ubii.sessions.Session
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      let ubiiSession = {
        id: uuidv4(),
        name: 'myo-session',
        interactions: [ubiiInteraction],
        ioMappings: [
          {
            interactionId: ubiiInteraction.id,
            interactionInput: {
              internalName: inputClientMyoData.internalName,
              messageFormat: inputClientMyoData.messageFormat
            },
            topic: inputClientMyoData.topic
          },
          {
            interactionId: ubiiInteraction.id,
            interactionOutput: {
              internalName: outputServerMyoData.internalName,
              messageFormat: outputServerMyoData.messageFormat
            },
            topic: outputServerMyoData.topic
          }
        ]
      };
      //assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiSession = ubiiSession;
      this.$data.ubiiInteraction = ubiiInteraction;
      this.$data.inputClientMyoData = inputClientMyoData;
      this.$data.outputServerMyoData = outputServerMyoData;

    },
    startInterface: function() {
      Myo.connect('com.ubii.myoInterface');
      console.log("connected");

      Myo.on("connected", function(data, timestamp) {
      console.log("Myo successfully connected. Data: " + JSON.stringify(data) + ". Timestamp: " + timestamp + ".");
      });
      
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
              this.$data.outputServerMyoData.topic,

              myoData => {

                this.$data.serverMyoData = 
                  emg = {
                    v0: myoData.emg.v0,
                    v1: myoData.emg.v1,
                    v2: myoData.emg.v2,
                    v3: myoData.emg.v3,
                    v4: myoData.emg.v4,
                    v5: myoData.emg.v5,
                    v6: myoData.emg.v6,
                    v7: myoData.emg.v7
                  },
                  orientation = {
                    x:0,
                    y:0,
                    z:0,
                    w:0
                  },
                  gyroscope = {
                    x:0,
                    y:0,
                    z:0
                  },
                  accelerometer = {
                    x:0,
                    y:0,
                    z:0
                  },
                  gesture = ""
              }
            );

            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(() => {
                this.$data.interfaceStarted = true;
              });
        });
      });
    },
    stopInterface: function() {
      if(!this.interfaceStarted) return;
      this.interfaceStarted = false;

      //disconnect Myo
      Myo.disconnect();
      
      //unsubscribe and stop session
      UbiiClientService.client.unsubscribe(
        this.$data.outputServerMyoData.topic
      );
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });
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
    },
    getMyoData: function() {

      if(!this.interfaceStarted) return;

      Myo.on("imu", (data, timestamp) => {
        //Just display data
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

        //Client data
        this.$data.clientMyoData.orientation = {
           x:data.orientation.x,
          y:data.orientation.y,
          z:data.orientation.z,
          w:data.orientation.w
        };
        this.$data.clientMyoData.gyroscope = {
          x:data.gyroscope .x,
          y:data.gyroscope .y,
          z:data.gyroscope .z
        };
        this.$data.clientMyoData.accelerometer = {
          x:data.accelerometer.x,
          y:data.accelerometer.y,
          z:data.accelerometer.z
        };

        //Publish
        UbiiClientService.client.publish(
          this.$data.ubiiDevice.name,
          this.$data.inputClientMyoData.topic,
          'myoData',
          this.$data.clientMyoData
      );


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
          },

          emg = {
            v0:data[0],
            v1:data[1],
            v2:data[2],
            v3:data[3],
            v4:data[4],
            v5:data[5],
            v6:data[6],
            v7:data[7]
          }

          this.$data.clientMyoData.emg = emg;

          //publish client emg data
          UbiiClientService.client.publish(
            this.$data.ubiiDevice.name,
            this.$data.inputClientMyoData.topic,
            'myo_event',
            this.$data.clientMyoData
          );
      });
      Myo.on("pose", (data,timestep) => {
        this.$data.myoGesture = data;
      });
      Myo.on("pose_off", (data,timestemp) => {
        this.$data.myoGesture = "";
      })
    }
  }
};
</script>

<style scoped lang="stylus">
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr 5fr;
  height: 100%;
}

.options {
  margin: 25px;
}

.mouse-pointer-area {
  margin: 25px;
  border: 3px solid black;
  height: 300px;
}

.hideCursor {
  cursor: none;
}

.server-mouse-position-indicator {
  position: relative;
  width: 10px;
  height: 10px;
  background-color: red;
}

.start-example {
  text-align: center;
  margin-top: 25px;
}

.start-example-button {
  width: 50px;
  height: 50px;
}
</style>