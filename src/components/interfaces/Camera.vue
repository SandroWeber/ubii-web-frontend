<template>
  <div class="interface-wrapper">
    <video id="video" class="camera-image" autoplay></video>
    <div id="video-overlay" class="video-overlay"></div>
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

import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { setTimeout } from 'timers';

export default {
  name: 'Interface-Camera',
  mounted: function() {
    let video = document.getElementById('video');
    this.videoOverlayElement = document.getElementById('video-overlay');

    this.publishFrequency = 500; // ms

    // Get access to the camera!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Not adding `{ audio: true }` since we only want video now
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        //video.src = window.URL.createObjectURL(stream);
        video.srcObject = stream;
        video.play();

        this.videoElement = video;
        this.start();
      });
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

      UbiiClientService.isConnected().then(() => {
        this.createUbiiSpecs();

        UbiiClientService.registerDevice(this.ubiiDevice).then(device => {
          if (device) {
            this.ubiiDevice = device;
          }
        });
      });
    },
    stop: function() {
      this.cocoSsdActive = false;
      this.ubiiDevice && UbiiClientService.deregisterDevice(this.ubiiDevice);
      this.stopCoCoSSDObjectDetection();
    },
    /* ubii methods */
    createUbiiSpecs: function() {
      this.ubiiDeviceName = 'CameraWebInterface';
      let topicPrefix =
        '/' + UbiiClientService.getClientID() + '/' + this.ubiiDeviceName;

      this.ubiiDevice = {
        name: this.ubiiDeviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        clientId: UbiiClientService.getClientID(),
        components: [
          {
            topic: topicPrefix + '/camera_image',
            messageFormat: 'ubii.dataStructure.Image',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: topicPrefix + '/objects',
            messageFormat: 'ubii.dataStructure.Object2DList',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };

      let interactionCoCoSSDOnCreatedCB =
        'state => {' +
        'let prepareModel = async () => {' +
        'state.model = await state.modules.cocoSsd.load();' +
        'state.timestampLastImage = 0;' +
        'state.tLastProcess = Date.now();' +
        '};' +
        'prepareModel();' +
        '};';

      // we really need a functional interaction editor for this (async parts and class constructors aren't handled ver well by .toString())
      let interactionCoCoSSDProcessCB =
        '(inputs, outputs, state) => {' +
        'let tNow = Date.now();' +
        'if (tNow < state.tLastProcess + 1000) { return; }' +
        'state.tLastProcess = tNow;' +
        //'console.info("interactionCoCoSSDProcessCB");' +
        'let image = inputs.image;' +
        'if (image && state.model) {' +
        // prediction function
        'let predict = async () => {' +
        //'console.info("predicting");' +
        'let imgTensor = state.modules.tf.tensor3d(image.data, [image.height, image.width, 3], "int32");' +
        'let predictions = await state.model.detect(imgTensor);' +
        'return predictions;' +
        '};' +
        // make predictions
        'predict().then(predictions => {' +
        //'console.info(predictions);' +
        // generate output list
        'let outputList = [];' +
        'predictions.forEach(prediction => {' +
        'let pos = {x: prediction.bbox[0] / image.width, y: prediction.bbox[1] / image.height};' +
        'outputList.push( { ' +
        'id: prediction.class, ' +
        'pose: { position: pos }, ' +
        'size: {x: prediction.bbox[2] / image.width, y: prediction.bbox[3] / image.height} } );' +
        '});' +
        // write output
        'outputs.predictions = { elements: outputList };' +
        '});' +
        '}' +
        '};';

      this.ubiiInteractionCoCoSSD = {
        id: uuidv4(),
        name: 'CameraWebInterface - Interaction CoCoSSD',
        inputFormats: [
          {
            internalName: 'image',
            messageFormat: 'ubii.dataStructure.Image2D'
          }
        ],
        outputFormats: [
          {
            internalName: 'predictions',
            messageFormat: 'ubii.dataStructure.Object2DList'
          }
        ],
        onCreated: interactionCoCoSSDOnCreatedCB,
        processingCallback: interactionCoCoSSDProcessCB.toString()
      };

      this.ubiiSessionCoCoSSD = {
        id: uuidv4(),
        name: 'CameraWebInterface - Session CoCoSSD',
        interactions: [this.ubiiInteractionCoCoSSD],
        ioMappings: [
          {
            interactionId: this.ubiiInteractionCoCoSSD.id,
            inputMappings: [
              {
                name: this.ubiiInteractionCoCoSSD.inputFormats[0].internalName,
                topicSource: this.ubiiDevice.components[0].topic
              }
            ],
            outputMappings: [
              {
                name: this.ubiiInteractionCoCoSSD.outputFormats[0].internalName,
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
      UbiiClientService.subscribe(
        this.ubiiDevice.components[1].topic,
        predictedObjectsList => {
          this.drawCoCoSSDLabels(predictedObjectsList.elements);
        }
      );

      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
        session: this.ubiiSessionCoCoSSD
      }).then(response => {
        if (response.error) {
          console.warn(response.error);
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
      UbiiClientService.unsubscribe(this.ubiiDevice.components[1].topic);

      this.cocoSSDLabels.forEach(div => {
        div.style.visibility = 'hidden';
      });

      this.ubiiSessionCoCoSSD &&
        UbiiClientService.callService({
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
      UbiiClientService.publishRecord({
        topic: this.ubiiDevice.components[0].topic,
        timestamp: {
          seconds: seconds,
          nanos: nanos
        },
        image2D: {
          width: img.width,
          height: img.height,
          data: data,
          dataFormat: 'RGB8'
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
        divElement.style.textShadow = '0 0 10px yellow, 0 0 20px yellow';
        divElement.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
        divElement.style.position = 'relative';
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
