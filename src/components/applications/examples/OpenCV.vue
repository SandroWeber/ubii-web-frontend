<template>
  <div class="example-wrapper">
    <video id="video" class="camera-image" autoplay></video>
    <!--<div id="video-overlay" class="video-overlay"></div>-->
    <canvas id="canvas-opencv" class="canvas-opencv"></canvas>
    <button
      @click="onButtonOpenCVTest"
      :class="{
        'toggle-active': openCVTestActive,
        'toggle-inactive': !openCVTestActive
      }"
    >
      OpenCV Test
    </button>
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

const ImageDataFormats = ProtobufLibrary.ubii.dataStructure.Image2D.DataFormat;

export default {
  name: 'Example-OpenCV',
  mounted: function() {
    let video = document.getElementById('video');
    //this.videoOverlayElement = document.getElementById('video-overlay');
    this.canvasOpenCV = document.getElementById('canvas-opencv');

    this.publishFrequency = 50; // ms

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
      openCVTestActive: false
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
      this.openCVTestActive = false;
      this.ubiiDevice && UbiiClientService.instance.deregisterDevice(this.ubiiDevice);
      this.stopOpenCVTest();
    },
    /* ubii methods */
    createUbiiSpecs: function() {
      this.ubiiDeviceName = 'opencv_example';
      let topicPrefix =
        '/' + UbiiClientService.instance.getClientID() + '/' + this.ubiiDeviceName;

      this.ubiiDevice = {
        name: this.ubiiDeviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        clientId: UbiiClientService.instance.getClientID(),
        components: [
          {
            topic: topicPrefix + '/camera_image',
            messageFormat: 'ubii.dataStructure.Image2D',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: topicPrefix + '/opencv_image',
            messageFormat: 'ubii.dataStructure.Image2D',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          }
        ]
      };

      let onCreatedInteractionOpenCVTest =
        'state => {' +
        'state.timestampLastImage = 0;' +
        'state.tLastProcess = Date.now();' +
        '};';

      // we really need a functional interaction editor for this (async parts and class constructors aren't handled ver well by .toString())
      let processInteractionOpenCVTest =
        '(inputs, outputs, state) => {' +
        'let tNow = Date.now();' +
        'if (tNow < state.tLastProcess + 50) { return; }' +
        'state.tLastProcess = tNow;' +
        //'console.info("processInteractionOpenCVTest");' +
        'let cameraImage = inputs.imageCamera;' +
        'if (cameraImage) {' +
        'const cv = state.modules.cv;' +
        'const cvImageRBGA = new cv.Mat(cameraImage.data, cameraImage.height, cameraImage.width, cv.CV_8UC4);' +
        // image conversion
        'const cvImageGray = cvImageRBGA.bgrToGray();' +
        //'const cvImageOutput = cvImageGray.cvtColor(cv.COLOR_GRAY2RGB);' +
        //'const cvImageHSV = cvImageRBG.cvtColor(cv.COLOR_BGR2HSV);' +
        // output image
        //'console.info(cvImageOutput);' +
        'outputs.imageOpenCV = {width: cvImageGray.cols, height: cvImageGray.rows, data: cvImageGray.getData(), dataFormat: ' +
        ImageDataFormats.GRAY8 +
        '};' +
        '}' +
        '};';

      this.ubiiInteractionOpenCVTest = {
        id: uuidv4(),
        name: 'OpenCV Example - Test',
        inputFormats: [
          {
            internalName: 'imageCamera',
            messageFormat: 'ubii.dataStructure.Image2D'
          }
        ],
        outputFormats: [
          {
            internalName: 'imageOpenCV',
            messageFormat: 'ubii.dataStructure.Image2D'
          }
        ],
        onCreated: onCreatedInteractionOpenCVTest,
        processingCallback: processInteractionOpenCVTest.toString()
      };

      this.ubiiSessionOpenCVTest = {
        id: uuidv4(),
        name: 'OpenCV Example - Session OpenCV Test',
        interactions: [this.ubiiInteractionOpenCVTest],
        ioMappings: [
          {
            interactionId: this.ubiiInteractionOpenCVTest.id,
            inputMappings: [
              {
                name: this.ubiiInteractionOpenCVTest.inputFormats[0]
                  .internalName,
                topicSource: this.ubiiDevice.components[0].topic
              }
            ],
            outputMappings: [
              {
                name: this.ubiiInteractionOpenCVTest.outputFormats[0]
                  .internalName,
                topicDestination: this.ubiiDevice.components[1].topic
              }
            ]
          }
        ]
      };
    },
    /* interface methods */
    onButtonOpenCVTest: function() {
      this.openCVTestActive = !this.openCVTestActive;

      if (this.openCVTestActive) {
        this.startOpenCVTest();
      } else {
        this.stopOpenCVTest();
      }
    },
    startOpenCVTest: function() {
      UbiiClientService.instance.subscribeTopic(
        this.ubiiDevice.components[1].topic,
        image => {
          this.drawImageOpenCV(image);
        }
      );

      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
        session: this.ubiiSessionOpenCVTest
      }).then(response => {
        if (response.error) {
          console.warn(response.error);
        }
      });

      let continuousPublish = () => {
        this.publishImage();

        if (this.openCVTestActive) {
          setTimeout(continuousPublish.bind(this), this.publishFrequency);
        }
      };
      continuousPublish();
    },
    stopOpenCVTest: function() {
      UbiiClientService.instance.unsubscribeTopic(this.ubiiDevice.components[1].topic);

      this.ubiiSessionOpenCVTest &&
        UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
          session: this.ubiiSessionOpenCVTest
        });
    },
    publishImage: function() {
      let img = this.captureImage();
      // reduce from RGBA8 to RGB8, fitting tensorflow model
      /*let data = img.data.filter((element, index, array) => {
        return (index + 1) % 4 !== 0;
      });*/
      let data = img.data;

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
          dataFormat: ImageDataFormats.RGBA8
        }
      });
    },
    captureImage: function() {
      var canvas = document.createElement('canvas');
      canvas.height = this.videoElement.videoHeight;
      canvas.width = this.videoElement.videoWidth;

      /*let videoRatio = canvas.width / canvas.height;
      let displayRatio =
        this.videoElement.clientWidth / this.videoElement.clientHeight;

      if (displayRatio > videoRatio) {
        this.videoOverlayElement.style.width =
          videoRatio * this.videoOverlayElement.clientHeight + 'px';
      } else if (displayRatio < videoRatio) {
        this.videoOverlayElement.style.height =
          videoRatio * this.videoOverlayElement.clientWidth + 'px';
      }*/
      var ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    drawImageOpenCV: function(image) {
      if (!this.openCVTestActive) {
        return;
      }
      //console.info(image);

      const ctx = this.canvasOpenCV.getContext('2d');
      // set canvas dimensions
      this.canvasOpenCV.width = image.width;
      this.canvasOpenCV.height = image.height;

      let imageDataRGBA = undefined;
      if (image.dataFormat === ImageDataFormats.GRAY8) {
        imageDataRGBA = [];
        for (let i = 0; i < image.data.length; i++) {
          imageDataRGBA.push(image.data[i]);
          imageDataRGBA.push(image.data[i]);
          imageDataRGBA.push(image.data[i]);
          imageDataRGBA.push(255);
        }
      } else if (image.dataFormat === ImageDataFormats.RGB8) {
        imageDataRGBA = [];
        for (let i = 0; i < image.data.length; i++) {
          imageDataRGBA.push(image.data[i]);
          if ((i + 1) % 3 === 0) {
            imageDataRGBA.push(255);
          }
        }
      } else if (image.dataFormat === ImageDataFormats.RGBA8) {
        imageDataRGBA = image.data;
      }

      //console.info(imageDataRGBA);
      const imgData = new ImageData(
        new Uint8ClampedArray(imageDataRGBA),
        image.width,
        image.height
      );
      ctx.putImageData(imgData, 0, 0);
    }
  }
};
</script>

<style scoped>
.example-wrapper {
  display: grid;
  grid-gap: 5px;
  padding: 5px;
  grid-template-rows: auto 30px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-areas:
    'camera-image camera-image canvas-opencv canvas-opencv'
    'button-coco-ssd placeholder-a placeholder-b placeholder-c';
}

.camera-image {
  grid-area: camera-image;
  width: 100%;
  height: 100%;
}

.canvas-opencv {
  grid-area: canvas-opencv;
  justify-self: center;
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
