<template>
  <div class="interface-wrapper">
    <video id="video" class="camera-image" autoplay></video>
    <button @click="onButtonCoCoSSD">coco-ssd object detection</button>
  </div>
</template>

<script>
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

import uuidv4 from 'uuid/v4';

import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default {
  name: 'Interface-Camera',
  mounted: function() {
    this.videoElement = document.getElementById('video');

    // Get access to the camera!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Not adding `{ audio: true }` since we only want video now
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function(stream) {
          //video.src = window.URL.createObjectURL(stream);
          video.srcObject = stream;
          video.play();
        });
    }

    this.start();
  },
  beforeDestroy: function() {
    this.stop();
  },
  data: () => {
    return {};
  },
  methods: {
    start: function() {
      UbiiClientService.isConnected().then(() => {
        this.createUbiiSpecs();

        UbiiClientService.registerDevice(this.ubiiDevice).then(device => {
          if (device) {
            this.ubiiDevice = device;
          }
        });

        UbiiClientService.subscribe(
          this.ubiiDevice.components[1].topic,
          predictedObjects => {
            console.info(predictedObjects);
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
      });
    },
    stop: function() {
      this.ubiiDevice && UbiiClientService.deregisterDevice(this.ubiiDevice);
      this.ubiiSessionCoCoSSD &&
        UbiiClientService.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: this.ubiiSessionCoCoSSD
        });
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
        '};' +
        'prepareModel();' +
        '};';

      // we really need a functional interaction editor for this (async parts and class constructors aren't handled ver well by .toString())
      let interactionCoCoSSDProcessCB =
        '(inputs, outputs, state) => {' +
        'if (inputs.image && state.model) {' +
        // prediction function
        'let predict = async () => {' +
        'let imgTensor = state.modules.tf.tensor3d(inputs.image.data, [inputs.image.height, inputs.image.width, 3], "int32");' +
        'let predictions = await state.model.detect(imgTensor);' +
        'return predictions;' +
        '};' +
        // make predictions
        'predict().then(predictions => {' +
        //'console.info(predictions);' +
        // generate output list
        'let outputList = [];' +
        'predictions.forEach(prediction => {' +
        'let pos = {x: prediction.bbox[0] / inputs.image.width, y: prediction.bbox[1] / inputs.image.height};' +
        'outputList.push( { id: prediction.class, pose: { position: pos } } );' +
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
      var ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    drawPredictions: function(predictionsList) {}
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
</style>
