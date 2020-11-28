<template>
  <div class="example-wrapper">
    <multiselect
      class="multiselect-topic-list"
      v-model="selectedCameraTopic"
      :options="cameraTopics"
      placeholder="Pick an image topic"
    ></multiselect>

    <div class="processing-options">
      <input
        type="radio"
        id="processing-option-coco-ssd"
        value="coco-ssd"
        v-model="processingOption"
      />
      <label for="processing-option-coco-ssd">CoCo SSD</label>
      <br />
      <input
        type="radio"
        id="processing-option-tesseract-ocr"
        value="tesseract-ocr"
        v-model="processingOption"
      />
      <label for="processing-option-tesseract-ocr">Tesseract OCR</label>
      <app-button
        class="button round button-toggle-processing"
        :class="processing ? 'red-accent' : 'green-accent'"
        @click="startProcessing"
      >
        {{ textProcessingButton }}
      </app-button>
    </div>
    <!--<div id="video-overlay" class="video-overlay"></div>-->
    <canvas id="canvas-image-mirror" class="image-mirror"></canvas>
    <!--<button
      @click="onButtonOpenCVTest"
      :class="{
        'toggle-active': openCVTestActive,
        'toggle-inactive': !openCVTestActive
      }"
    >
      OpenCV Test
    </button>-->
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
const ImageDataFormats = ProtobufLibrary.ubii.dataStructure.Image2D.DataFormat;

import { AppButton } from '../../../appComponents/appComponents.js';

export default {
  name: 'ImageProcessing',
  components: {
    Multiselect,
    AppButton
  },
  mounted: function() {
    this.canvasImageMirror = document.getElementById('canvas-image-mirror');

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
        this.subscribedCameraTopic &&
        this.selectedCameraTopic !== this.subscribedCameraTopic
      ) {
        UbiiClientService.unsubscribeTopic(
          this.subscribedCameraTopic,
          this.drawImageTopicMirror
        );
      }

      if (this.selectedCameraTopic !== null) {
        this.subscribedCameraTopic = this.selectedCameraTopic;
        UbiiClientService.subscribeTopic(
          this.subscribedCameraTopic,
          this.drawImageTopicMirror
        );
      }
    }
  },
  methods: {
    start: function() {
      UbiiClientService.waitForConnection().then(() => {
        this.getImageTopicList();
      });
    },
    stop: function() {},
    /* ubii methods */
    createUbiiSpecs: function() {},
    getImageTopicList: async function() {
      //TODO: get ubii components and search for image tags
      let topicListReply = await UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
      });
      this.cameraTopics = topicListReply.stringList.elements.filter(topic =>
        topic.includes('image')
      );
    },
    startProcessing: function() {},
    /* interface methods */
    drawImageTopicMirror: function(image) {
      this.drawImage(image, this.canvasImageMirror);
    },
    drawImage: function(image, canvas) {
      if (!image || !canvas) {
        return;
      }
      console.info(image);
      console.info(canvas);

      const ctx = canvas.getContext('2d');

      let imageDataRGBA = undefined;
      if (image.dataFormat === ImageDataFormats.GRAY8) {
        console.info('ImageDataFormats.GRAY8');
        imageDataRGBA = [];
        for (let i = 0; i < image.data.length; i++) {
          imageDataRGBA.push(image.data[i]);
          imageDataRGBA.push(image.data[i]);
          imageDataRGBA.push(image.data[i]);
          imageDataRGBA.push(255);
        }
      } else if (image.dataFormat === ImageDataFormats.RGB8) {
        console.info('ImageDataFormats.RGB8');
        imageDataRGBA = [];
        for (let i = 0; i < image.data.length; i++) {
          imageDataRGBA.push(image.data[i]);
          if ((i + 1) % 3 === 0) {
            imageDataRGBA.push(255);
          }
        }
      } else if (image.dataFormat === ImageDataFormats.RGBA8) {
        console.info('ImageDataFormats.RGBA8');
        imageDataRGBA = image.data;
      }
      console.info(imageDataRGBA);
      const imgData = new ImageData(
        new Uint8ClampedArray(imageDataRGBA),
        image.width,
        image.height
      );

      /*let imageRatio = image.width / image.height;
      let drawWidth = imageRatio * canvas.height;
      ctx.drawImage(imgData, 0, 0, drawWidth, canvas.height);*/
    }
  }
};
</script>

<style scoped>
.example-wrapper {
  display: grid;
  grid-gap: 5px;
  padding: 5px;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    'topic-list-select'
    'camera-mirror';
}

.multiselect-topic-list {
  grid-area: topic-list-select;
  background-color: darkgray;
  color: black;
}

.processing-options {
}

.button-toggle-processing {
  padding: 5px;
}

.image-mirror {
  height: 480px;
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
