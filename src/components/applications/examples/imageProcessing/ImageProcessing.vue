<template>
  <div class="img-processing-wrapper">
    <multiselect
      class="multiselect-topic-list"
      v-model="selectedCameraTopic"
      :options="cameraTopics"
      placeholder="Pick an image topic"
    ></multiselect>

    <div class="processing-options">
      <input type="radio" id="processing-option-none" value="none" v-model="processingOption" />
      <label for="processing-option-none">none</label>
      <br />
      <input type="radio" id="processing-option-coco-ssd" value="coco-ssd" v-model="processingOption" />
      <label for="processing-option-coco-ssd">CoCo SSD Object Recognition</label>
      <br />
      <input
        type="radio"
        id="processing-option-tesseract-ocr"
        value="tesseract-ocr"
        v-model="processingOption"
        :disabled="true"
      />
      <label for="processing-option-tesseract-ocr">Tesseract OCR (coming soon)</label>
      <app-button
        class="button round button-toggle-processing"
        :class="processing ? 'red-accent' : 'green-accent'"
        @click="toggleProcessing"
      >
        {{ textProcessingButton }}
      </app-button>
    </div>

    <video id="video" class="video-playback" autoplay></video>

    <canvas id="canvas-image-mirror" class="image-mirror-canvas"></canvas>
    <div id="image-mirror-overlay" class="image-mirror-overlay"></div>
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
import UbiiSessionCocoSSD from './ubiiSessionCocoSSD';

export default {
  name: 'ImageProcessing',
  components: {
    Multiselect,
    AppButton
  },
  mounted: function() {
    this.canvasImageMirror = document.getElementById('canvas-image-mirror');
    this.imageMirrorOverlay = document.getElementById('image-mirror-overlay');

    this.start();
  },
  beforeDestroy: function() {
    this.stop();
  },
  data: () => {
    return {
      selectedCameraTopic: null,
      cameraTopics: [],
      processingOption: null,
      textProcessingButton: 'Start',
      processing: false
    };
  },
  watch: {
    selectedCameraTopic: function() {
      // unsubscribe old topic first
      if (
        (this.subscribedCameraTopic && this.selectedCameraTopic !== this.subscribedCameraTopic) ||
        this.selectedCameraTopic === 'none'
      ) {
        UbiiClientService.unsubscribeTopic(this.subscribedCameraTopic, this.drawImageTopicMirror);

        if (this.selectedCameraTopic === 'none' || this.selectedCameraTopic === null) {
          let canvas = this.canvasImageMirror;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      if (this.selectedCameraTopic !== null && this.selectedCameraTopic !== 'none') {
        this.subscribedCameraTopic = this.selectedCameraTopic;
        UbiiClientService.subscribeTopic(this.subscribedCameraTopic, this.drawImageTopicMirror);
      }
    }
  },
  methods: {
    start: async function() {
      if (this.running) {
        return;
      }
      this.running = true;

      await UbiiClientService.waitForConnection();

      // set up ubii camera interface
      this.topicPrefix = '/' + UbiiClientService.getClientID() + '/image-processing';
      this.ubiiComponentCamera = new UbiiComponentCamera(100, ImageDataFormats.RGB8, document.getElementById('video'));
      this.ubiiComponentCamera.start();

      // start polling a list of possible image topics
      let pollImageTopicList = () => {
        this.getImageTopicList();
        if (this.running) {
          setTimeout(pollImageTopicList, 1000);
        }
      };
      pollImageTopicList();
    },
    stop: function() {
      this.running = false;

      this.ubiiComponentCamera && this.ubiiComponentCamera.stop();
      this.runningSession && this.runningSession.stopSession();
    },
    /* ubii methods */
    getImageTopicList: async function() {
      //TODO: get ubii components and search for image tags
      let topicListReply = await UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
      });
      this.cameraTopics = topicListReply.stringList.elements.filter(
        topic => topic.includes('camera_image') || topic.includes('camera-image')
      );
      this.cameraTopics.push('none');
    },
    toggleProcessing: function() {
      if (this.processing) {
        this.processing = false;
        this.textProcessingButton = 'Start';
        this.runningSession.stopSession();
        return;
      } else {
        this.processing = true;
        this.textProcessingButton = 'Stop';
      }

      if (this.processingOption === 'coco-ssd') {
        this.predictionsOuptputTopic = this.topicPrefix + '/coco-ssd/predictions';
        this.runningSession = new UbiiSessionCocoSSD(
          this.subscribedCameraTopic,
          this.predictionsOuptputTopic,
          this.imageMirrorOverlay
        );
      }
      this.runningSession.startSession();
    },
    /* interface methods */
    drawImageTopicMirror: function(image) {
      this.drawImage(image, this.canvasImageMirror);
    },
    drawImage: async function(image, canvas) {
      if (!image || !canvas) {
        return;
      }

      // adjust overlay element
      this.imageMirrorOverlay.style.width = this.canvasImageMirror.clientWidth + 'px';
      this.imageMirrorOverlay.style.height = this.canvasImageMirror.clientHeight + 'px';

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

      const ctx = canvas.getContext('2d');
      let imageRatio = image.width / image.height;
      let drawWidth = imageRatio * canvas.height;
      let imageBitmap = await createImageBitmap(imgData);
      ctx.drawImage(imageBitmap, 0, 0, drawWidth, canvas.height);
    }
  }
};
</script>

<style scoped>
.img-processing-wrapper {
  display: grid;
  grid-gap: 5px;
  padding: 5px;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    'topic-list-select processing-modes-select'
    'video-playback image-mirror';
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

.image-mirror-canvas {
  grid-area: image-mirror;
  height: 480px;
}

.image-mirror-overlay {
  grid-area: image-mirror;
  width: 100%;
  height: 100%;
  justify-self: center;
  overflow: hidden;
}

.object-detection-label {
  position: relative;
  background-color: yellow;
  color: black;
}
</style>
