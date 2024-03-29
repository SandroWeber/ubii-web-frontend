<template>
  <div class="interface-wrapper">
    <video id="video" class="camera-image" autoplay></video>
    <div id="video-overlay" class="video-overlay"></div>
    <button
      @click="onButtonCoCoSSD"
      :class="{
        'toggle-active': cocoSsdActive,
        'toggle-inactive': !cocoSsdActive
      }"
    >
      toggle coco-ssd object detection
    </button>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

import uuidv4 from 'uuid/v4';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { setTimeout } from 'timers';

export default {
  name: 'Interface-Camera',
  mounted: function() {
    let video = document.getElementById('video');
    this.videoOverlayElement = document.getElementById('video-overlay');

    this.publishFrequency = 100; // ms

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
      cocoSsdActive: false
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
      });
    },
    stop: function() {
      this.cocoSsdActive = false;
      this.ubiiDevice && UbiiClientService.instance.deregisterDevice(this.ubiiDevice);
      this.stopCoCoSSDObjectDetection();
    },
    /* ubii methods */
    createUbiiSpecs: async function() {
      this.ubiiDeviceName = 'CameraWebInterface';
      let topicPrefix =
        '/' + UbiiClientService.instance.getClientID() + '/' + this.ubiiDeviceName;

      this.ubiiDevice = {
        name: this.ubiiDeviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        clientId: UbiiClientService.instance.getClientID(),
        components: [
          {
            topic: topicPrefix + '/camera_image',
            messageFormat: 'ubii.dataStructure.Image',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: topicPrefix + '/objects',
            messageFormat: 'ubii.dataStructure.Object2DList',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          }
        ]
      };

      this.ubiiSessionCoCoSSD = {
        name: 'CameraWebInterface - Session CoCoSSD',
        processingModules: [{ name: 'COCO-SSD-local' }],
        ioMappings: [
          {
            processingModuleName: 'COCO-SSD-local',
            inputMappings: [
              {
                inputName: 'image',
                topicSource: this.ubiiDevice.components[0].topic
              }
            ],
            outputMappings: [
              {
                outputName: 'predictions',
                topicDestination: this.ubiiDevice.components[1].topic
              }
            ]
          }
        ]
      };
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
      UbiiClientService.instance.subscribeTopic(
        this.ubiiDevice.components[1].topic,
        this.handleObjectPredictions
      );

      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
        session: this.ubiiSessionCoCoSSD
      }).then(response => {
        if (response.error) {
          console.warn(response.error);
        } else if (response.session) {
          this.ubiiSessionCoCoSSD = response.session;
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
      UbiiClientService.instance.unsubscribeTopic(
        this.ubiiDevice.components[1].topic,
        this.handleObjectPredictions
      );

      this.cocoSSDLabels.forEach(div => {
        div.style.visibility = 'hidden';
      });

      this.ubiiSessionCoCoSSD &&
        UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
          session: this.ubiiSessionCoCoSSD
        });
    },
    publishImage: function() {
      let img = this.captureImage();
      // reduce from RGBA8 to RGB8, fitting tensorflow model
      let data = img.data.filter((element, index, array) => {
        return (index + 1) % 4 !== 0;
      });

      UbiiClientService.instance.publishRecord({
        topic: this.ubiiDevice.components[0].topic,
        timestamp: UbiiClientService.instance.generateTimestamp(),
        image2D: {
          width: img.width,
          height: img.height,
          data: data,
          dataFormat:
            ProtobufLibrary.ubii.dataStructure.Image2D.DataFormat.RGBA8
        }
      });
    },
    handleObjectPredictions: function(predictedObjectsList) {
      this.drawCoCoSSDLabels(predictedObjectsList.elements);
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
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas:
    'camera-image camera-image camera-image'
    'button-coco-ssd placeholder-a placeholder-b';
}

.camera-image {
  grid-area: camera-image;
  width: 100%;
  height: 100%;
}

.video-overlay {
  grid-area: camera-image;
  width: 100%;
  justify-self: center;
  overflow: hidden;
}

.object-detection-label {
  position: relative;
  background-color: yellow;
  color: black;
}

.toggle-active {
  background-color: green;
}

.toggle-inactive {
  background-color: grey;
}
</style>
