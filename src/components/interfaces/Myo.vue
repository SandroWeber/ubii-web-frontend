<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <br>
      <div class="c">Myo Status:</div>
      <div class="c">{{getMyoConnected()}}</div>
      <br>
      <table class="sturdy">
        <tr>
          <th>Datatype</th>
          <th colspan="8">Client-Data</th> 
        </tr>
        <tr>
          <th>EMG</th>
          <td>{{this.round(clientMyoData.emg.v0, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v1, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v2, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v3, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v4, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v5, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v6, 1)}}</td>
          <td>{{this.round(clientMyoData.emg.v7, 1)}}</td>      
        </tr>
        <tr>
          <th>Orientation</th>
          <td colspan=2>{{this.round(clientMyoData.orientation.x, 1)}}</td>
          <td colspan=2>{{this.round(clientMyoData.orientation.y, 1)}}</td>
          <td colspan=2>{{this.round(clientMyoData.orientation.z, 1)}}</td>
          <td colspan=2>{{this.round(clientMyoData.orientation.w, 1)}}</td>
        </tr>
        <tr>
          <th>Gyroscope</th>
          <td colspan=3>{{this.round(clientMyoData.gyroscope.x, 1)}}</td>
          <td colspan=3>{{this.round(clientMyoData.gyroscope.y, 1)}}</td>
          <td colspan=2>{{this.round(clientMyoData.gyroscope.z, 1)}}</td>
        </tr>
        <tr>
          <th>Accelerometer</th>
          <td colspan=3>{{this.round(clientMyoData.accelerometer.x, 1)}}</td>
          <td colspan=3>{{this.round(clientMyoData.accelerometer.y, 1)}}</td>
          <td colspan=2>{{this.round(clientMyoData.accelerometer.z, 1)}}</td>            
        </tr>
        <tr>
          <th>Gesture</th>
          <td colspan=8>{{gestureToString(clientMyoData.gesture)}}</td>
        </tr>
      </table>
      <br>
      <table class="sturdy">
        <tr>
          <th>Datatype</th>
          <th colspan="8">Server-Data</th>
        </tr>
        <tr>
          <th>EMG</th>
          <td>{{this.round(serverMyoData.emg.v0, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v1, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v2, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v3, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v4, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v5, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v6, 1)}}</td>
          <td>{{this.round(serverMyoData.emg.v7, 1)}}</td>        
        </tr>
        <tr>
          <th>Orientation</th>
          <td colspan=2>{{this.round(serverMyoData.orientation.x, 1)}}</td>
          <td colspan=2>{{this.round(serverMyoData.orientation.y, 1)}}</td>
          <td colspan=2>{{this.round(serverMyoData.orientation.z, 1)}}</td>
          <td colspan=2>{{this.round(serverMyoData.orientation.w, 1)}}</td>
        </tr>
        <tr>
          <th>Gyroscope</th>
          <td colspan=3>{{this.round(serverMyoData.gyroscope.x, 1)}}</td>
          <td colspan=3>{{this.round(serverMyoData.gyroscope.y, 1)}}</td>
          <td colspan=2>{{this.round(serverMyoData.gyroscope.z, 1)}}</td>
        </tr>
        <tr>
          <th>Accelerometer</th>
          <td colspan=3>{{this.round(serverMyoData.accelerometer.x, 1)}}</td>
          <td colspan=3>{{this.round(serverMyoData.accelerometer.y, 1)}}</td>
          <td colspan=2>{{this.round(serverMyoData.accelerometer.z, 1)}}</td>            
        </tr>
        <tr>
          <th>Gesture</th>
          <td colspan=8>{{gestureToString(serverMyoData.gesture)}}</td>
        </tr>
      </table>
    </div>
  </UbiiClientContent>
</template>

<script>
import Myo from "myo";

import UbiiClientContent from '../applications/sharedModules/UbiiClientContent';
import UbiiEventBus from '../../services/ubiiClient/ubiiEventBus';

import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default {
  name: 'Interface-Myo',
  components: { UbiiClientContent },
  
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopInterface();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stopInterface();
      this.startInterface();
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
      interfaceStarted: false,

      pollingInterval: null,
      myoConnected: false,

      serverMyoData: {
        emg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
        orientation: {x:0,y:0,z:0,w:0},
        gyroscope: {x:0,y:0,z:0},
        accelerometer: {x:0,y:0,z:0},
        gesture: 0
      },

      clientMyoData: {
        emg: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
        orientation: {x:0,y:0,z:0,w:0},
        gyroscope: {x:0,y:0,z:0},
        accelerometer: {x:0,y:0,z:0},
        gesture: 0
      }
    };
  },

  methods: {
    // create specifications for the protobuf messages
    createUbiiSpecs: function() {

      // helper definitions that we can reference later
      let deviceName = 'web-interface-myo';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
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
        if(input.clientMyoData){
          output.serverMyoData = {
            emg : {
              v0: input.clientMyoData.emg.v0,
              v1: input.clientMyoData.emg.v1,
              v2: input.clientMyoData.emg.v2,
              v3: input.clientMyoData.emg.v3,
              v4: input.clientMyoData.emg.v4,
              v5: input.clientMyoData.emg.v5,
              v6: input.clientMyoData.emg.v6,
              v7: input.clientMyoData.emg.v7
            },
            orientation : {
              x: input.clientMyoData.orientation.x,
              y: input.clientMyoData.orientation.y,
              z: input.clientMyoData.orientation.z,
              w: input.clientMyoData.orientation.w
            },
            gyroscope : {
              x: input.clientMyoData.gyroscope.x,
              y: input.clientMyoData.gyroscope.y,
              z: input.clientMyoData.gyroscope.z
            },
            accelerometer : {
              x: input.clientMyoData.accelerometer.x,
              y: input.clientMyoData.accelerometer.y,
              z: input.clientMyoData.accelerometer.z
            },
            gesture : input.clientMyoData.gesture
          }; 
          //console.log(Object.keys(input.clientMyoData.emg) + " client");
          //console.log(output.serverMyoData + "server");
        }
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
            inputMappings: [
              {
                name: inputClientMyoData.internalName,
                topicSource: inputClientMyoData.topic
              }
            ],
            outputMappings: [
              {
                name: outputServerMyoData.internalName,
                topicDestination: outputServerMyoData.topic
              }
            ]
          }
        ]
      };

      // assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiInteraction = ubiiInteraction;

      this.$data.inputClientMyoData = inputClientMyoData;
      this.$data.outputServerMyoData = outputServerMyoData;

      this.$data.ubiiSession = ubiiSession;
    },

    startInterface: function() {
      UbiiClientService.isConnected().then(() => {
        // create all the specifications we need to define our example application
        // these are protobuf messages to be sent to the server (saved in this.$data)
        this.createUbiiSpecs();

        //Myo setup
        this.connectMyo();
        this.getMyoData();
        this.setPublishInterval();

        // register the mouse pointer device
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then(device => {
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
              // a callback to be called when new data on this topic arrives
              myoData => {
                this.$data.serverMyoData = {
                  emg : {
                    v0: myoData.emg.v0,
                    v1: myoData.emg.v1,
                    v2: myoData.emg.v2,
                    v3: myoData.emg.v3,
                    v4: myoData.emg.v4,
                    v5: myoData.emg.v5,
                    v6: myoData.emg.v6,
                    v7: myoData.emg.v7
                  },
                  orientation : {
                    x: myoData.orientation.x,
                    y: myoData.orientation.y,
                    z: myoData.orientation.z,
                    w: myoData.orientation.w
                  },
                  gyroscope : {
                    x: myoData.gyroscope.x,
                    y: myoData.gyroscope.y,
                    z: myoData.gyroscope.z
                  },
                  accelerometer : {
                    x: myoData.accelerometer.x,
                    y: myoData.accelerometer.y,
                    z: myoData.accelerometer.z
                  },
                  gesture : myoData.gesture
                };
              }
            ); 
            this.publishMyoData();
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
      if (!this.interfaceStarted) return;

      this.interfaceStarted = false;

      //disconnect Myo
      clearInterval(this.$data.pollingInterval);
      this.disconnectMyo();
      //Myo.disconnect();
      this.$data.myoConnected = false;

      // unsubscribe and stop session
      UbiiClientService.client.unsubscribe(
        this.$data.outputServerMyoData.topic
      );
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });
    },

    //round values for better display
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },

    //connect myo and enable emg stream
    connectMyo: function() {
      Myo.connect('com.ubii.myoInterface');

      Myo.on("connected", function() {
      this.streamEMG(true);
      //console.log("Myo successfully connected. Data: " + JSON.stringify(data) + ". Timestamp: " + timestamp + ".");
      });
    },

    //publish data every 10ms
    setPublishInterval: function() {
      this.pollingInterval = setInterval(() => this.publishMyoData(), 10);
    },

    publishMyoData: function(){
      if(!this.$data.myoConnected)
        return;
      
      //depricated

      /*UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputClientMyoData.topic,
        'myoEvent',
        this.$data.clientMyoData
      ); */

      UbiiClientService.publishRecord({
        topic: this.$data.inputClientMyoData.topic,
        myoEvent: this.$data.clientMyoData
      });
    },

    //Disable all event listeners and disconnect
    disconnectMyo: function() {
      Myo.off('emg');
      Myo.off('imu');
      Myo.off('pose');
      Myo.off('pose_off');
      this.$data.myoConnected = false;
      Myo.disconnect();
    },

    //Set up all the event listeners
    getMyoData: function() {
      Myo.on('imu', (data) => {
        this.$data.myoConnected = true;

        this.$data.clientMyoData.orientation = {
          x:data.orientation.x,
          y:data.orientation.y,
          z:data.orientation.z,
          w:data.orientation.w
        };
        this.$data.clientMyoData.gyroscope = {
          x:data.gyroscope.x,
          y:data.gyroscope.y,
          z:data.gyroscope.z
        };
        this.$data.clientMyoData.accelerometer = {
          x:data.accelerometer.x,
          y:data.accelerometer.y,
          z:data.accelerometer.z
        };
      });

      Myo.on('emg', (data) => {
        this.$data.myoConnected = true;
        this.$data.clientMyoData.emg = {
          v0:data[0],
          v1:data[1],
          v2:data[2],
          v3:data[3],
          v4:data[4],
          v5:data[5],
          v6:data[6],
          v7:data[7]
          };
      });

      Myo.on('pose', (data) => {
        this.$data.myoConnected = true;
        var e;
        switch(data){
          case 'fingers_spread':  e = 1; break;
          case 'wave_in':         e = 2; break;
          case 'wave_out':        e = 3; break;
          case 'fist':            e = 4; break;
          case 'double_tap':      e = 5; break;
          default:                e = 0;
        }
        /* if(e != 0)
          console.log(this.gestureToString(e)); */
          
        this.$data.clientMyoData.gesture = e;
      });

      Myo.on('pose_off', () => {
        this.$data.clientMyoData.gesture = 0;
      });

      Myo.on('connected', () => {
        this.$data.myoConnected = true;
      });

      Myo.on('disconnected', () => {
        this.$data.myoConnected = false;
      });
    },

    gestureToString: function(g) {
      switch(g){
        case 1:   return 'fingers spread';
        case 2:   return 'wave in';       
        case 3:   return 'wave out';      
        case 4:   return 'fist';          
        case 5:   return 'double tap';
        default:  return 'rest';
      }
    },

    //print conection status
    getMyoConnected: function() {
        return this.$data.myoConnected ? "connected" : "disconnected";
    }
  }
};
</script>

<style scoped lang="stylus">
div.c {
  text-align: center;
}
table {
  margin: 15px 0;
  border: 1px solid black;
  table-layout: fixed;
  width: 400px; 
  margin-left:auto; 
  margin-right:auto;
}
table, th, td {
  border: 1px solid black;
  border-collapse: collapse;
  padding: 5px;
}
td{
  text-align: right;
}
th{
  text-align: left;
}
.sturdy th:nth-child(1){
  width: 32%;
}
.sturdy td:nth-child(2),
.sturdy td:nth-child(3),
.sturdy td:nth-child(4),
.sturdy td:nth-child(5),
.sturdy td:nth-child(6),
.sturdy td:nth-child(7),
.sturdy td:nth-child(8),
.sturdy td:nth-child(9),
.sturdy td:nth-child(10),
.sturdy td:nth-child(11),
.sturdy td:nth-child(12),
.sturdy td:nth-child(13),
.sturdy td:nth-child(14),
.sturdy td:nth-child(15),
.sturdy td:nth-child(16),
.sturdy td:nth-child(17) {
  width: 5%;
}
</style>
