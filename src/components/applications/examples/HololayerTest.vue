<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div class="grid">
      <div class="seperator header-demo">
        <span class="separator-label">Hololayer Demo</span>
      </div>

      <div class="options">
        <!-- a checkbox to toggle showing the client side pointer -->
        <input
          id="checkboxClientPointer"
          type="checkbox"
          v-model="hololayer"
        />
        <label for="checkboxClientPointer">Connect to Hololayer</label>
      </div>

      <div class="seperator header-description">
        <span class="separator-label">Description</span>
      </div>

      <div class="description-general">
        Click to call the Hololayer Layer API
      </div>

      <div 
        id="feedback-area"
        class="feedback-area">
        Message from Hololayer
      </div>
    </div>
  </UbiiClientContent>
</template>

<script>
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiClientContent from '../sharedModules/UbiiClientContent';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

library.add(faPlay);

export default {
  name: 'ExampleMousePointer',
  components: { UbiiClientContent },
  /* STEP 1: mounted() is our vue component entry point, start here! */
  mounted: function() {
    // unsubscribe before page is suddenly closed
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.startExample();
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.stopExample();
    });

    // make sure we're connected, then start the example
    UbiiClientService.instance.waitForConnection().then(() => {
      this.startExample();
    });
    UbiiClientService.instance.onDisconnect(() => {
      this.stopExample();
    });
  },
  beforeDestroy: function() {
    this.stopExample();
  },
  data: () => {
    return {
      hololayer: false,
      ubiiClientService: UbiiClientService.instance,
      exampleStarted: false,
      clientMousePosition: { x: 0, y: 0 },
      serverResponse: 'Disconnected',
      clientPointerInside: false
    };
  },
  watch: {
    hololayer: function(value) {
      if (
        !UbiiClientService.instance.isConnected() ||
        !this.ubiiDevice.name ||
        !this.ubiiComponentHololayerPointer.topic
      ) {
        return;
      }
      this.$data.hololayer = value;
      this.publishHololayerPointer(this.$data.hololayer);
      console.log(this.$data.hololayer);
    }
  },
  methods: {
    createUbiiSpecs: function() {
      // create specifications for ubi-interact

      // helper definitions that we can reference later
      let deviceName = 'web-example-hololayer';
      let topicPrefix =
        '/' + UbiiClientService.instance.getClientID() + '/' + deviceName;

      // define our abstract device and its components

      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      this.ubiiDevice = {
        clientId: UbiiClientService.instance.getClientID(),
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [

          // component publishing the flag to connect to Hololayer
          {
            name: 'connect / disconnect hololayer',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
            topic: topicPrefix + '/connect_hololayer',
            messageFormat: 'bool'
          },
          // component subscribing to the string returned by the server processing module
          {
            name: 'hololayer response from api',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER,
            topic: topicPrefix + '/hololayer_response',
            messageFormat: 'string'
          }
        ]
      };
      this.ubiiComponentHololayerPointer = this.ubiiDevice.components[0];
      this.ubiiComponentServerPointer = this.ubiiDevice.components[1];

      let onCreatedPM =
        state => {
          state.timestampLastImage = 0;
          state.tLastProcess = Date.now(); 
        };

      // specification of a ubii.processing.ProcessingModule
      let processingCallback = (deltaTime, input, output, state) => {
        if (!input.hololayer) {
          output.response = "No connection to Hololayer";
        }
        else{

          console.log("Calling Hololayer...");
          state.modules['node-fetch']('https://siemens.hololayer.io/swagger/api/Users')
          /*
                .then(res => res.json())
                .then(json => {
                  output.response = json["username"]; 
                  console.log("Response: " + output.response)})
                .catch(error => console.error("Error: " + error));
          */
              
                .then(res => res.text())
                .then(out => {
                  output.response = out; 
                  console.log("Response: " + output.response);
                  return output;})
                .catch(error => console.error("Error: " + error));
              
        }
        return output;
      };

      this.ubiiProcessingModule = {
        name: 'hololayer-connection-test',
        onCreated: onCreatedPM.toString(),
        onProcessingStringified: processingCallback.toString(),
        processingMode: {
          frequency: {
            hertz: 1
          }
        },
        inputs: [
          {
            internalName: 'hololayer',
            messageFormat: 'bool'
          }
        ],
        outputs: [
          {
            internalName: 'response',
            messageFormat: 'string'
          }
        ]
      };
      this.ubiiProcessingModule.inputHololayerPointer = this.ubiiProcessingModule.inputs[0];
      this.ubiiProcessingModule.outputServerPointer = this.ubiiProcessingModule.outputs[0];

      // specification of a ubii.sessions.Session
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      this.ubiiSession = {
        name: 'web-hololayer-example-session',
        processingModules: [this.ubiiProcessingModule],
        ioMappings: [
          {
            processingModuleName: this.ubiiProcessingModule.name,
            inputMappings: [
              {
                inputName: this.ubiiProcessingModule.inputHololayerPointer
                  .internalName,
                topicSource: 'topic',
                topic: this.ubiiComponentHololayerPointer.topic
              },
              
            ],
            outputMappings: [
              {
                outputName: this.ubiiProcessingModule.outputServerPointer
                  .internalName,
                topicDestination: 'topic',
                topic: this.ubiiComponentServerPointer.topic
              }
            ]
          }
        ]
      };
    },
    /* STEP 2: making all calls related to ubi-interact backend */
    startExample: function() {
      if (this.exampleStarted) {
        return;
      }
      this.$data.exampleStarted = true;

      // make sure we're connected, then continue
      UbiiClientService.instance.waitForConnection().then(() => {
        // create all the specifications we need to define our example application
        // these are protobuf messages to be sent to the server (saved in this.$data)
        this.createUbiiSpecs();

        // register the mouse pointer device
        UbiiClientService.instance.registerDevice(this.ubiiDevice)
          .then(response => {
            // the device specs we send to backend intentionally left out the device ID
            // if the backend accepts the device registration, it will send back our specs
            // plus any necessary info (like the ID) filled in by the backend
            // that way we make sure the ID is created by the backend and valid
            if (response.id) {
              // success, we accept the device specs sent back to us as the final specs
              this.ubiiDevice = response;
              return this.ubiiDevice;
            } else {
              // something went wrong, print to console
              console.error(response);
              return undefined;
            }
          })
          .then(() => {
            // subscribe to the device topics so we are notified when new data arrives on the topic
            UbiiClientService.instance.subscribeTopic(
              this.ubiiComponentServerPointer.topic,//ubiiComponentServerPointer.topic,
              // a callback to be called when new data on this topic arrives
              this.subscriptionServerConnectionResponse
            );
            console.log("subscription");

            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.instance.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
                session: this.ubiiSession
              })
              .then(response => {
                if (response.session) {
                  this.ubiiSession = response.session;
                  console.log("session open");
                }
              });
          });
      });
    },
    stopExample: async function() {
      if (!this.exampleStarted) return;

      this.exampleStarted = false;

      // unsubscribe and stop session
      UbiiClientService.instance.unsubscribeTopic(
        this.ubiiComponentServerPointer.topic,
        this.subscriptionServerConnectionResponse
      );
      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.ubiiSession
      });

      if (this.ubiiDevice) {
        await UbiiClientService.instance.deregisterDevice(this.ubiiDevice);
      }
    },
    /* publishing and subscribing */
    subscriptionServerConnectionResponse: function(response) {
      // when we get a response, we display it in the text box

      this.$data.hololayerResponse = response;
      console.log("Response: "+ this.$data.hololayerResponse);

      document.getElementById('feedback-area').textContent = this.$data.hololayerResponse;
    },

    publishHololayerPointer: function(boolean) {
      // if the checkbox is changed, we publish this info on the related topic
      UbiiClientService.instance.publishRecord({
        topic: this.ubiiComponentHololayerPointer.topic,
        bool: boolean
      });
    }

    /* UI events */
    /*,
    onMouseMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current mouse position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let boundingRect = document
        .getElementById('mouse-pointer-area')
        .getBoundingClientRect();
      let relativeMousePosition = {
        x: (event.clientX - boundingRect.left) / boundingRect.width,
        y: (event.clientY - boundingRect.top) / boundingRect.height
      };

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client mouse position
      this.publishClientPointerPosition(this.$data.clientMousePosition);
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
      this.publishClientPointerPosition(this.$data.clientMousePosition);
    }
    */
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 2fr 6fr;
  grid-template-rows: 30px 300px auto 30px auto;
  grid-template-areas:
    'header-demo header-demo'
    'demo-options demo-mouse-area'
    'description-options feedback-area'
    'header-description header-description'
    'description-general description-general';
  height: 100%;
}

.options {
  grid-area: demo-options;
  margin: 25px;
}

.mouse-pointer-area {
  grid-area: demo-mouse-area;
  margin: 10px;
  border: 3px solid white;
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

.description-general {
  grid-area: description-general;
  padding: 20px;
}

.description-options {
  grid-area: description-options;
  padding: 20px;
}

.feedback-area {
  grid-area: feedback-area;
  padding: 20px;
}

.header-demo {
  grid-area: header-demo;
  margin: 10px;
}

.header-description {
  grid-area: header-description;
  margin: 10px;
}

.seperator {
  border-bottom: solid 1px orange;
  height: 10px;
  line-height: 20px;
  text-align: left;
}

.separator-label {
  display: inline;
  padding-left: 15px;
  padding-right: 20px;
  color: orange;
  background-color: black;
}
</style>
