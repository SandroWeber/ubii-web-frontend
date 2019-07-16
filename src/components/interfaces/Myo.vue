<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div class="grid">
      <div class="options">
        <!-- a checkbox to toggle showing the client side pointer -->
        <input id="checkboxClientPointer" type="checkbox" v-model="showClientPointer">
        <label for="checkboxClientPointer">Show Client Pointer</label>

        <br>

        <!-- a checkbox to toggle showing the server side pointer -->
        <input id="checkboxServerPointer" type="checkbox" v-model="showServerPointer">
        <label for="checkboxServerPointer">Show Server Pointer</label>

        <br>

        <!-- a checkbox to toggle inverting the pointer position at the server before sending it back to client -->
        <input id="checkboxMirrorPointer" type="checkbox" v-model="mirrorPointer">
        <label for="checkboxMirrorPointer">Mirror Pointer</label>
        
        <br>
        <span> ServerMouse Position: </span>
          <br>
          <span>
            {{this.round(serverMousePosition.x, 1)}}
            {{this.round(serverMousePosition.y ,1)}}
          </span>
        <br>
        <br>
        
        <!-- Myo related stuff -->
        <button v-on:click="publishMyoData()">Publish Myo Data</button>
        <br>
        <span>EMG:</span>
        <br>
        <span>
          {{this.round(clientMyoData.emg.v0, 1)}}
          {{this.round(clientMyoData.emg.v1, 1)}}
          {{this.round(clientMyoData.emg.v2, 1)}}
          {{this.round(clientMyoData.emg.v3, 1)}}
          {{this.round(clientMyoData.emg.v4, 1)}}
          {{this.round(clientMyoData.emg.v5, 1)}}
          {{this.round(clientMyoData.emg.v6, 1)}}
          {{this.round(clientMyoData.emg.v7, 1)}}
        </span>
        <br>
        <span>Orientation:</span>
        <br>
        <span>
          {{this.round(clientMyoData.orientation.x, 1)}}
          {{this.round(clientMyoData.orientation.y, 1)}}
          {{this.round(clientMyoData.orientation.z, 1)}}
          {{this.round(clientMyoData.orientation.w, 1)}}
        </span>
        <br>
        <span>Gyroscope:</span>
        <br>
        <span>
          {{this.round(clientMyoData.gyroscope.x, 1)}}
          {{this.round(clientMyoData.gyroscope.y, 1)}}
          {{this.round(clientMyoData.gyroscope.z, 1)}}
        </span>
        <br>
        <span>Accelerometer:</span>
        <br>
        <span>
          {{this.round(clientMyoData.accelerometer.x, 1)}}
          {{this.round(clientMyoData.accelerometer.y, 1)}}
          {{this.round(clientMyoData.accelerometer.z, 1)}}            
        </span>
        <span>Accelerometer:{{clientMyoData.g}}</span>
        <br>
        <br>
        <span>Gesture: {{clientMyoData.gesture}}</span>
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
        <span>Server-Gesture: {{serverMyoData.gesture}}</span>
      </div>

      <!-- the interaction area.
      if our pointer is inside, its position is sent to the server and back to us, then displayed as a red square-->
      <div
        id="mouse-pointer-area"
        class="mouse-pointer-area"
        v-bind:class="{ hideCursor: !showClientPointer }"
        v-on:mousemove="onMouseMove($event)"
        v-on:mouseenter="clientPointerInside = true;"
        v-on:mouseleave="clientPointerInside = false;"
        v-on:touchstart="onTouchStart($event)"
        v-on:touchend="clientPointerInside = false;"
        v-on:touchmove="onTouchMove($event)"
      >
        <div
          class="server-mouse-position-indicator"
          :style="{top: serverMousePosition.y + 'px', left: serverMousePosition.x + 'px' }"
          v-show="showServerPointer && clientPointerInside"
        ></div>
      </div>
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

import { mapActions } from 'vuex';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

library.add(faPlay);

/* eslint-disable no-console */

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
      showClientPointer: true,
      showServerPointer: true,
      mirrorPointer: false,
      ubiiClientService: UbiiClientService,
      exampleStarted: false,
      serverMousePosition: { x: 0, y: 0 },
      clientPointerInside: false,

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
  watch: {
    mirrorPointer: function(value) {
      if (
        !UbiiClientService.isConnected ||
        !this.$data.ubiiDevice.name ||
        !this.$data.inputMirror.topic
      ) {
        return;
      }

      // if the checkbox is changed, we publish this info on the related topic
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputMirror.topic,
        this.$data.inputMirror.messageFormat,
        value
      );
    }
  },
  methods: {
    createUbiiSpecs: function() {
      // create specifications for the protobuf messages

      // helper definitions that we can reference later
      let deviceName = 'web-interface-myo';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
      let inputClientPointer = {
        internalName: 'clientPointer',
        messageFormat: 'ubii.dataStructure.Vector2',
        topic: topicPrefix + '/' + 'mouse_client_position'
      };
      let inputMirror = {
        internalName: 'mirrorPointer',
        messageFormat: 'bool',
        topic: topicPrefix + '/' + 'mirror_mouse'
      };
      let outputServerPointer = {
        internalName: 'serverPointer',
        messageFormat: 'ubii.dataStructure.Vector2',
        topic: topicPrefix + '/' + 'mouse_server_position'
      };
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
            topic: inputClientPointer.topic,
            messageFormat: inputClientPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: inputMirror.topic,
            messageFormat: inputMirror.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: outputServerPointer.topic,
            messageFormat: outputServerPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          },
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
        if (input.clientPointer) {
          //console.log("processingCallbackMouse");
          if (input.mirrorPointer === true) {
            output.serverPointer = {
              x: 1 - input.clientPointer.x,
              y: 1 - input.clientPointer.y
            };
          } else {
             output.serverPointer = {
             x: input.clientPointer.x,
             y: input.clientPointer.y
            };
          } 
        } 
        if(input.clientMyoData){
          console.info(input.toString());
          console.log("processingCallbackMyo");
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
        }
      };
      let ubiiInteraction = {
        id: uuidv4(),
        name: 'myo-interaction',
        processingCallback: processingCallback.toString(),
        inputFormats: [
          {
            internalName: inputClientPointer.internalName,
            messageFormat: inputClientPointer.messageFormat
          },
          {
            internalName: inputMirror.internalName,
            messageFormat: inputMirror.messageFormat
          },
          {
            internalName: inputClientMyoData.internalName,
            messageFormat: inputClientMyoData.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: outputServerPointer.internalName,
            messageFormat: outputServerPointer.messageFormat
          },
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
                name: inputClientPointer.internalName,
                topicSource: inputClientPointer.topic
              },
              {
                name: inputMirror.internalName,
                topicSource: inputMirror.topic
              },
              {
                name: inputClientMyoData.internalName,
                topicSource: inputClientMyoData.topic
              }
            ],
            outputMappings: [
              {
                name: outputServerPointer.internalName,
                topicDestination: outputServerPointer.topic
              },
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
      this.$data.inputClientPointer = inputClientPointer;
      this.$data.inputMirror = inputMirror;
      this.$data.outputServerPointer = outputServerPointer;
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

        this.connectMyo();
        this.getMyoData();

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
                console.log("subscribe Myo recieved");
              }
            ); 
            this.publishMyoData();
            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(response => {
                console.info(response);
                this.$data.exampleStarted = true;
              });
          });
      });
    },
    stopInterface: function() {
      if (!this.exampleStarted) return;

      this.exampleStarted = false;

      //disconnect Myo
      Myo.disconnect();

      // unsubscribe and stop session
      UbiiClientService.client.unsubscribe(
        this.$data.outputServerPointer.topic
      );
      UbiiClientService.client.unsubscribe(
        this.$data.outputServerMyoData.topic
      );
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });
    },
    onMouseMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current mouse position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let boundingRect = event.currentTarget.getBoundingClientRect();
      let relativeMousePosition = {
        x: event.offsetX / boundingRect.width,
        y: event.offsetY / boundingRect.height
      };

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client mouse position
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputClientPointer.topic,
        'vector2',
        this.$data.clientMousePosition
      );
    },
    onTouchStart: function(event) {
      this.$data.clientPointerInside = true;
      this.onTouchMove(event);
    },
    onTouchMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current touch position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let relativeMousePosition = {
        x:
          (event.touches[0].clientX - event.target.offsetLeft) /
          event.target.offsetWidth,
        y:
          (event.touches[0].clientY - event.target.offsetTop) /
          event.target.offsetHeight
      };

      if (
        relativeMousePosition.x < 0 ||
        relativeMousePosition.x > 1 ||
        relativeMousePosition.y < 0 ||
        relativeMousePosition.y > 1
      ) {
        this.$data.clientPointerInside = false;
        return;
      }

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client touch position
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputClientPointer.topic,
        'vector2',
        this.$data.clientMousePosition
      );
    },
    ...mapActions('interactions', {
      addInteraction: 'add'
    }),
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },
    connectMyo: function() {
      Myo.connect('com.ubii.myoInterface');

      Myo.on("connected", function(data, timestamp) {
      this.streamEMG(true);
      console.log("Myo successfully connected. Data: " + JSON.stringify(data) + ". Timestamp: " + timestamp + ".");
      });
    },
    publishMyoData: function(){
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputClientMyoData.topic,
        'myoEvent',
        this.$data.clientMyoData
      );
      console.log('Published Myo Data');
    },
    disconnectMyo: function() {
      Myo.off('emg');
      Myo.streamEMG(false);
      Myo.off('imu');
      Myo.off('pose');
      Myo.off('pose_off')
      Myo.disconnect();
    },

    getMyoData: function() {
      Myo.on('imu', (data) => {
        //Client data
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
        var e;
        switch(data){
          case 'fingers_spread':  e = 1; break;
          case 'wave_in':         e = 2; break;
          case 'wave_out':        e = 3; break;
          case 'fist':            e = 4; break;
          case 'double_tap':      e = 5; break;
          default:                e = 0;
        }
        this.$data.myoGesture = e;
      });
      Myo.on('pose_off', () => {
        this.$data.myoGesture = 0;
      });
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
