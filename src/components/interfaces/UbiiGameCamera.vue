<template>
  <div class="interface-wrapper">
    <div class="debug-log">{{ textOutput }}</div>
    <video id="video" class="camera-image" autoplay></video>
    <button
      @click="onButtonCoCoSSD"
      :class="{'toggle-active': cocoSsdActive, 'toggle-inactive': !cocoSsdActive}"
    >toggle coco-ssd object detection</button>
  </div>
</template>

<script>
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

import uuidv4 from 'uuid/v4';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { setTimeout } from 'timers';

export default {
  name: 'Interface-UbiiController-GameCamera',
  mounted: function() {
     // For CAMERA
    let video = document.getElementById('video');
    this.videoOverlayElement = document.getElementById('video-overlay');
    this.publishFrequency = 500; // ms
    // Get access to the camera!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Not adding `{ audio: true }` since we only want video now
      navigator.mediaDevices.getUserMedia({ video: true }).then(
        //resolved
        stream => {
          //video.src = window.URL.createObjectURL(stream);
          video.srcObject = stream;
          video.play();

          this.videoElement = video;
          this.start();
        },
        //rejected
        error => {
          console.warn(error);
        }
      );
    }
  },
  beforeDestroy: function() {
    this.stop();
  },
  data: () => {    
    return {
      cocoSsdActive: false,
      textOutput: 'have fun :)'
    };
  },
  methods: {
    start: function() {
      this.cocoSSDLabels = [];

      UbiiClientService.instance.waitForConnection().then(() => {
        this.createUbiiSpecs();

        UbiiClientService.instance.registerDevice(this.ubiiDevice).then(device => {
          if (device) {
            this.ubiiDevice = device;
          }
        });
        UbiiClientService.instance.subscribeTopic(
            this.componentTextOutput.topic,
            text => {
                this.textOutput = text;
              }
            );
        });
    },
    stop: function() {
      this.cocoSsdActive = false;
      this.ubiiDevice && UbiiClientService.instance.deregisterDevice(this.ubiiDevice);
      this.stopCoCoSSDObjectDetection();
    },
    /* ubii methods */
    createUbiiSpecs: async function() {
       if (this.clientId) {
        console.warn('tried to create ubii specs, but are already present');
        return;
      }

      this.deviceName = 'web-interface-ubii-controller-gamecamera';

      this.clientId = UbiiClientService.instance.getClientID();
      let topicPrefix = '/' + this.clientId + '/' + this.deviceName;

      this.ubiiDevice = {
        name: this.ubiiDeviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        clientId: UbiiClientService.instance.getClientID(),
        components: [
          {
            topic: topicPrefix + '/camera_image',
            messageFormat: 'ubii.dataStructure.Image',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          },
          {
            topic: topicPrefix + '/objects',
            messageFormat: 'ubii.dataStructure.Object2DList',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: topicPrefix + '/set_text',
            messageFormat: 'string',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          }
        ]
      };    
      
      this.componentCameraImage = this.ubiiDevice.components[0];
      this.componentCameraObjects = this.ubiiDevice.components[1];
      this.componentTextOutput = this.ubiiDevice.components[2];

      let interactionCocoSsdID = 'b74761e9-3cd3-400c-8144-23669e951c2c';
      let getInteractionResponse = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DATABASE_GET,
        interaction: {
          id: interactionCocoSsdID
        }
      });
      if (getInteractionResponse.error) {
        console.warn(getInteractionResponse.error);
      } else {
        this.interactionCocoSsdSpecs = getInteractionResponse.interaction;
      }

      this.ubiiSessionCoCoSSD = {
        id: uuidv4(),
        name: 'UbiiControllerCamera - Session CoCoSSD',
        processMode:
          ProtobufLibrary.ubii.sessions.ProcessMode
            .INDIVIDUAL_PROCESS_FREQUENCIES,
        interactions: [this.interactionCocoSsdSpecs],
        ioMappings: [
          {
            interactionId: this.interactionCocoSsdSpecs.id,
            inputMappings: [
              {
                name: this.interactionCocoSsdSpecs.inputFormats[0].internalName,
                topicSource: this.ubiiDevice.components[0].topic
              }
            ],
            outputMappings: [
              {
                name: this.interactionCocoSsdSpecs.outputFormats[0]
                  .internalName,
                topicDestination: this.ubiiDevice.components[1].topic
              }
            ]
          }
        ]
      };
    },
     registerUbiiSpecs: function() {
      if (this.initializing || this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to register ubii device, but is already registered'
        );
        return;
      }
      this.initializing = true;
      this.cocoSSDLabels = [];

      // register the mouse pointer device
      UbiiClientService.instance.waitForConnection().then(() => {
        UbiiClientService.instance.registerDevice(this.ubiiDevice)
          .then(device => {
            if (device.id) {
              this.ubiiDevice = device;
              this.hasRegisteredUbiiDevice = true;
              this.initializing = false;
              this.publishContinuousDeviceData();
            }
            return device;
          })
          .then(() => {
            UbiiClientService.instance.subscribeTopic(
              this.componentTextOutput.topic,
              this.setTextOutput
            );

            if (this.componentVibration) {
              UbiiClientService.instance.subscribeTopic(
                this.componentVibration.topic,
                this.vibrate
              );
            }
          });
      });
    },
    unregisterUbiiSpecs: async function() {
      if (!this.hasRegisteredUbiiDevice) {
        console.warn(
          'Tried to unregister ubii specs, but they are not registered.'
        );
        return;
      }

      if (this.ubiiDevice && this.ubiiDevice.components) {
        this.ubiiDevice.components.forEach(component => {
          // eslint-disable-next-line no-console
          console.log('unsubscribed to ' + component.topic);

          UbiiClientService.instance.unsubscribeTopic(component.topic);
        });
      }

      this.hasRegisteredUbiiDevice = false;

      //TODO: this should not happen here, move to interaction
      UbiiClientService.instance.publishRecord({
        topic: 'removeClient',
        string: UbiiClientService.instance.getClientID()
      });

      // TODO: unregister device
      this.ubiiDevice &&
        (await UbiiClientService.instance.deregisterDevice(this.ubiiDevice));
    },
    /* interface methods */
    onButtonCoCoSSD: function() {
      this.cocoSsdActive = !this.cocoSsdActive;

      if (this.cocoSsdActive) {
        this.startCoCoSSDObjectDetection();
      } else {
        this.stopCoCoSSDObjectDetection();
      }
    },
    startCoCoSSDObjectDetection: function() {
      UbiiClientService.instance.subscribe(
        this.ubiiDevice.components[1].topic,
        predictedObjectsList => {
          this.drawCoCoSSDLabels(predictedObjectsList.elements);
        }
      );

      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
        session: this.ubiiSessionCoCoSSD
      }).then(response => {
        if (response.error) {
          console.warn(response.error);
        } else {
          console.info(response);
        }
      });

      let continuousPublish = () => {
        this.publishImage();

        if (this.cocoSsdActive) {
          setTimeout(continuousPublish.bind(this), this.publishFrequency);
        }
      };
      continuousPublish();
    },
    stopCoCoSSDObjectDetection: function() {
      UbiiClientService.instance.unsubscribeTopic(this.ubiiDevice.components[1].topic);

      this.cocoSSDLabels.forEach(div => {
        div.style.visibility = 'hidden';
      });

      this.ubiiSessionCoCoSSD &&
        UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: this.ubiiSessionCoCoSSD
        });
    },
    publishImage: function() {
      let img = this.captureImage();
      // reduce from RGBA8 to RGB8, fitting tensorflow model
      let data = img.data.filter((element, index, array) => {
        return (index + 1) % 4 !== 0;
      });

      let tSeconds = Date.now() / 1000;
      let seconds = Math.floor(tSeconds);
      let nanos = Math.floor((tSeconds - seconds) * 1000000000);
      UbiiClientService.instance.publishRecord({
        topic: this.ubiiDevice.components[0].topic,
        timestamp: {
          seconds: seconds,
          nanos: nanos
        },
        image2D: {
          width: img.width,
          height: img.height,
          data: data,
          dataFormat:
            ProtobufLibrary.ubii.dataStructure.Image2D.DataFormat.RGBA8
        }
      });
    },
    captureImage: function() {
      var canvas = document.createElement('canvas');
      canvas.height = this.videoElement.videoHeight;
      canvas.width = this.videoElement.videoWidth;

      let videoRatio = canvas.width / canvas.height;
      let displayRatio =
        this.videoElement.clientWidth / this.videoElement.clientHeight;

      if (displayRatio > videoRatio) {
        this.videoOverlayElement.style.width =
          videoRatio * this.videoOverlayElement.clientHeight + 'px';
      } else if (displayRatio < videoRatio) {
        this.videoOverlayElement.style.height =
          videoRatio * this.videoOverlayElement.clientWidth + 'px';
      }

      var ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    drawCoCoSSDLabels: function(predictionsList) {
      if (!this.cocoSsdActive) {
        return;
      }

      while (this.cocoSSDLabels.length < predictionsList.length) {
        let divElement = document.createElement('div');
        divElement.style.color = 'black';
        divElement.style.border = '5px solid rgba(255, 255, 0, 0.4)';
        divElement.style.position = 'relative';
        divElement.style.textAlign = 'left';
        divElement.style.fontWeight = 'bold';
        this.videoOverlayElement.appendChild(divElement);
        this.cocoSSDLabels.push(divElement);
      }

      let overlayBoundings = this.videoOverlayElement.getBoundingClientRect();
      this.cocoSSDLabels.forEach((div, index) => {
        if (index < predictionsList.length) {
          div.innerHTML = predictionsList[index].id;
          // set position
          div.style.left =
            Math.floor(
              predictionsList[index].pose.position.x * overlayBoundings.width
            ) + 'px';
          div.style.top =
            Math.floor(
              predictionsList[index].pose.position.y * overlayBoundings.height
            ) + 'px';
          // set size
          div.style.width =
            Math.floor(predictionsList[index].size.x * overlayBoundings.width) +
            'px';
          div.style.height =
            Math.floor(
              predictionsList[index].size.y * overlayBoundings.height
            ) + 'px';
          div.style.textShadow = '0px 0px 10px yellow';

          div.style.visibility = 'visible';
        } else {
          div.style.visibility = 'hidden';
        }
      });
    }
  }
};
</script>

<style scoped>
.interface-wrapper {
  display: grid;
  grid-gap: 5px;
  padding: 5px;
  grid-template-rows: auto 30px;
  grid-template-columns: 1fr 20fr 20fr;
  grid-template-areas:
    'debug-log camera-image camera-image'
    'button-coco-ssd camera-image camera-image'
    'button-coco-ssd camera-image camera-image';
}

.camera-image {
  grid-area: camera-image;
  width: 100%;
  height: 100%;
}

.video-overlay {
  grid-area: camera-image;
  width: 100%;
  justify-self: right;
  overflow: hidden;
}

.object-detection-label {
  position: relative;
  background-color: yellow;
  color: black;
}

.toggle-active {
  grid-area: button-coco-ssd;
  background-color: green;
}

.toggle-inactive {
  grid-area: button-coco-ssd;
  background-color: grey;
}

.debug-log {
  grid-area: debug-log;
}
</style>
