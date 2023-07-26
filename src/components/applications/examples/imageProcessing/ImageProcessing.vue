<template>
  <div class="img-processing-wrapper">
    <multiselect class="multiselect-topic-list" v-model="selectedCameraTopic" :options="cameraTopics"
      placeholder="Pick an image topic"></multiselect>

    <div class="processing-options">
      <multiselect class="multiselect-pm-list" v-model="selectedProcessingModule" :options="imageProcessingModules"
        label="name" placeholder="Pick a processing module" @select="onPmSelected"></multiselect>

      <div>{{ selectedProcessingModuleDescription }}</div>

      <app-button class="button round button-toggle-processing" :class="processing ? 'red-accent' : 'green-accent'"
        @click="toggleProcessing">
        {{ textProcessingButton }}
      </app-button>
    </div>

    <div id="wrapper-image-topic" class="wrapper-image-topic">
      <canvas id="canvas-image-topic" class="canvas-image-topic"></canvas>
    </div>

    <div id="output-object-list-overlay" class="output-object-list-overlay"></div>

    <button class="btn-toggle-camera-feed" @click="showCameraFeed = !showCameraFeed">
      {{ showCameraFeed ? 'Hide' : 'Show' }} camera feed
    </button>
    <div v-show="showCameraFeed">
      <video id="video" class="video-playback" autoplay></video>
    </div>

  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
const ImageDataFormats = ProtobufLibrary.ubii.dataStructure.Image2D.DataFormat;

import { AppButton } from '../../../appComponents/appComponents.js';
import UbiiComponentCamera from '../../../../ubii/components/ubii-component-camera';
import ImageProcessingSession from './imageProcessingSession';

const UPDATE_INTERVAL_PMS_MS = 5000;

export default {
  name: 'ImageProcessing',
  components: {
    Multiselect,
    AppButton
  },
  mounted: function () {
    this.canvasImageTopic = document.getElementById('canvas-image-topic');
    this.canvasImageTopicOverlay = document.getElementById('output-object-list-overlay');

    this.subTokens = [];

    this.start();
  },
  beforeDestroy: function () {
    this.stop();
  },
  data: () => {
    return {
      selectedCameraTopic: null,
      cameraTopics: [],
      selectedProcessingModule: null,
      selectedProcessingModuleDescription: '',
      imageProcessingModules: [],
      processingOption: null,
      textProcessingButton: 'Start',
      processing: false,
      showCameraFeed: false
    };
  },
  watch: {
    selectedCameraTopic: async function () {
      let canvas = this.canvasImageTopic;
      const context = canvas.getContext('2d');
      console.info(context);

      // unsubscribe old topic first
      if (
        (this.topicCameraImage && this.selectedCameraTopic !== this.topicCameraImage) ||
        this.selectedCameraTopic === 'none'
      ) {
        this.subTokenCamera && (await UbiiClientService.instance.unsubscribe(this.subTokenCamera));

        if (this.selectedCameraTopic === 'none' || this.selectedCameraTopic === null) {
          context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        }
      }

      if (this.selectedCameraTopic !== null && this.selectedCameraTopic !== 'none') {
        this.topicCameraImage = this.selectedCameraTopic;
        this.subTokenCamera = await UbiiClientService.instance.subscribeTopic(
          this.topicCameraImage,
          this.drawImageTopicMirror
        );
        this.subTokens.push(this.subTokenCamera);
      }
    }
  },
  methods: {
    start: async function () {
      if (this.running) {
        return;
      }
      this.running = true;

      await UbiiClientService.instance.waitForConnection();

      await this.getImageProcessingModules();
      this.intervalUpdatePMs = setInterval(this.getImageProcessingModules, UPDATE_INTERVAL_PMS_MS);

      // set up ubii camera interface
      this.topicPrefix = '/' + UbiiClientService.instance.getClientID() + '/image-processing';
      this.ubiiComponentCamera = new UbiiComponentCamera(100, ImageDataFormats.RGB8, document.getElementById('video'));
      await this.ubiiComponentCamera.start();

      let deviceRegistration = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.DEVICE_REGISTRATION,
        device: {
          name: 'frontend-image-processing-example',
          clientId: UbiiClientService.instance.getClientID(),
          components: [this.ubiiComponentCamera.ubiiSpecs]
        }
      });
      if (deviceRegistration.error) {
        console.warn(deviceRegistration.error);
      } else {
        this.ubiiDevice = deviceRegistration.device;
      }

      // start polling a list of possible image topics
      let pollImageTopicList = async () => {
        await this.getImageTopicList();
        if (this.running) {
          setTimeout(pollImageTopicList, 1000);
        }
      };
      pollImageTopicList();
    },
    stop: function () {
      this.running = false;

      this.intervalUpdatePMs && clearInterval(this.intervalUpdatePMs);

      this.ubiiComponentCamera && this.ubiiComponentCamera.stop();
      this.runningSession && this.runningSession.stopSession();
    },
    /* ubii methods */
    getImageTopicList: async function () {
      let replyComponents = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.COMPONENT_GET_LIST,
        component: {
          messageFormat: 'ubii.dataStructure.Image2D',
          tags: ['camera']
        }
      });
      if (replyComponents.error) {
        console.warn(replyComponents.error);
      } else {
        let list = [];
        for (let component of replyComponents.componentList.elements) {
          list.push(component.topic);
        }
        list.push('none');
        this.cameraTopics = list;
      }
    },
    getImageProcessingModules: async function () {
      let reply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.PM_DATABASE_GET_LIST,
        processingModuleList: {
          elements: [
            {
              inputs: [{ messageFormat: 'ubii.dataStructure.Image2D' }],
              outputs: [{ messageFormat: 'ubii.dataStructure.Object2DList' }]
            }
          ]
        }
      });
      if (reply && reply.processingModuleList && reply.processingModuleList.elements) {
        this.imageProcessingModules = [];
        this.imageProcessingModules.push(...reply.processingModuleList.elements);
      }
    },
    onPmSelected: function (selectedOption) {
      this.selectedProcessingModuleDescription = selectedOption.description;
    },
    toggleProcessing: async function () {
      this.processing = !this.processing;

      if (this.processing) {
        this.textProcessingButton = 'Stop';
        this.object2DDivs = [];

        this.topicObject2DList = this.topicPrefix + '/objects';

        this.subTokens.push(
          await UbiiClientService.instance.subscribeTopic(this.topicObject2DList, this.handleObject2DList.bind(this))
        );

        this.runningSession = new ImageProcessingSession(
          this.topicCameraImage,
          this.topicObject2DList,
          this.selectedProcessingModule
        );
        await this.runningSession.startSession();
      } else {
        this.runningSession && (await this.runningSession.stopSession());

        while (this.canvasImageTopicOverlay.hasChildNodes()) {
          this.canvasImageTopicOverlay.removeChild(this.canvasImageTopicOverlay.childNodes[0]);
        }

        this.textProcessingButton = 'Start';
      }
    },
    /* interface methods */
    drawImageTopicMirror: function (record) {
      this.drawImage(record.image2D);
    },
    drawImage: async function (image) {
      if (!image) {
        return;
      }

      //console.info(`ImageProcessing example - received image ${image.width}x${image.height}`);
      let imageRatio = image.width / image.height;
      let drawHeight = this.canvasImageTopic.clientHeight;
      let drawWidth = Math.ceil(imageRatio * drawHeight);

      this.resizeCanvasImageTopic(imageRatio);

      /*let drawWidth = this.canvasImageTopic.clientWidth;
      let drawHeight = Math.floor(drawWidth / imageRatio);*/
      //console.info('source: ' + image.width + 'x' + image.height);
      //console.info('dest: ' + drawWidth + 'x' + drawHeight);

      // adjust overlay element
      //this.canvasImageTopicOverlay.style.top = this.canvasImageTopic.top;
      //this.canvasImageTopicOverlay.style.left = this.canvasImageTopic.left;
      this.canvasImageTopicOverlay.style.width = drawWidth + 'px';
      this.canvasImageTopicOverlay.style.height = drawHeight + 'px';

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

      const imgData = new ImageData(new Uint8ClampedArray(imageDataRGBA), image.width, image.height);

      const ctx = this.canvasImageTopic.getContext('2d');
      let imageBitmap = await createImageBitmap(imgData);
      //console.info(imageBitmap);
      ctx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height, 0, 0, drawWidth, drawHeight);
    },
    resizeCanvasImageTopic(imageRatio) {
      let boundingRectImageTopicWrapper = document.getElementById('wrapper-image-topic').getBoundingClientRect();
      this.canvasImageTopic.height = boundingRectImageTopicWrapper.height;
      this.canvasImageTopic.width = imageRatio * boundingRectImageTopicWrapper.height;
    },
    handleObject2DList(record) {
      let outputObjects = record.object2DList.elements;

      while (this.object2DDivs.length < outputObjects.length) {
        let divElement = document.createElement('div');
        divElement.style.color = 'black';
        divElement.style.border = '5px solid rgba(255, 255, 0, 0.4)';
        divElement.style.position = 'relative';
        divElement.style.textAlign = 'left';
        divElement.style.fontWeight = 'bold';
        this.canvasImageTopicOverlay.appendChild(divElement);
        this.object2DDivs.push(divElement);
      }

      let overlayBoundings = this.canvasImageTopicOverlay.getBoundingClientRect();
      this.object2DDivs.forEach((div, index) => {
        if (index < outputObjects.length) {
          div.innerHTML = outputObjects[index].id;
          // set position
          div.style.left = Math.floor(outputObjects[index].pose.position.x * overlayBoundings.width) + 'px';
          div.style.top = Math.floor(outputObjects[index].pose.position.y * overlayBoundings.height) + 'px';
          // set size
          div.style.width = Math.floor(outputObjects[index].size.x * overlayBoundings.width) + 'px';
          div.style.height = Math.floor(outputObjects[index].size.y * overlayBoundings.height) + 'px';
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
.img-processing-wrapper {
  margin-top: 20px;
  display: grid;
  grid-gap: 5px;
  padding: 5px;
  grid-template-rows: auto auto 400px 30px 1fr;
  grid-template-columns: 1fr;
  grid-template-areas:
    'topic-list-select'
    'processing-modes-select'
    'image-mirror'
    'btn-toggle-camera-feed'
    'video-playback';
  overflow: scroll;
}

.multiselect-topic-list {
  grid-area: topic-list-select;
  background-color: darkgray;
  color: black;
}

.processing-options {
  grid-area: processing-modes-select;
}

.button-toggle-processing {
  padding: 5px;
}

.video-playback {
  grid-area: video-playback;
}

.wrapper-image-topic {
  grid-area: image-mirror;
}

.canvas-image-topic {}

.output-object-list-overlay {
  grid-area: image-mirror;
  overflow: hidden;
}

.object-detection-label {
  position: relative;
  background-color: yellow;
  color: black;
}

.btn-toggle-camera-feed {
  grid-area: btn-toggle-camera-feed;
  width: 200px;
}
</style>
