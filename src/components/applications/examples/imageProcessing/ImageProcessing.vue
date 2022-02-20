<template>
  <div class="img-processing-wrapper">
    <multiselect
      class="multiselect-topic-list"
      v-model="selectedCameraTopic"
      :options="cameraTopics"
      placeholder="Pick an image topic"
    ></multiselect>

    <div class="processing-options">
      <multiselect
        class="multiselect-pm-list"
        v-model="selectedProcessingModule"
        :options="imageProcessingModules"
        label="name"
        placeholder="Pick a processing module"
        @select="onPmSelected"
      ></multiselect>

      <div>{{ selectedProcessingModuleDescription }}</div>

      <app-button
        class="button round button-toggle-processing"
        :class="processing ? 'red-accent' : 'green-accent'"
        @click="toggleProcessing"
      >
        {{ textProcessingButton }}
      </app-button>
    </div>

    <video id="video" class="video-playback" autoplay></video>

    <canvas id="canvas-image-topic-mirror" class="canvas-image-topic-mirror"></canvas>
    <div id="output-object-list-overlay" class="output-object-list-overlay"></div>
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

export default {
  name: 'ImageProcessing',
  components: {
    Multiselect,
    AppButton
  },
  mounted: function() {
    this.imageTopicDisplay = document.getElementById('canvas-image-topic-mirror');
    this.imageTopicDisplayOverlay = document.getElementById('output-object-list-overlay');

    this.start();
  },
  beforeDestroy: function() {
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
      processing: false
    };
  },
  watch: {
    selectedCameraTopic: function() {
      // unsubscribe old topic first
      if (
        (this.topicCameraImage && this.selectedCameraTopic !== this.topicCameraImage) ||
        this.selectedCameraTopic === 'none'
      ) {
        UbiiClientService.instance.unsubscribeTopic(this.topicCameraImage, this.drawImageTopicMirror);

        if (this.selectedCameraTopic === 'none' || this.selectedCameraTopic === null) {
          let canvas = this.imageTopicDisplay;
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      if (this.selectedCameraTopic !== null && this.selectedCameraTopic !== 'none') {
        this.topicCameraImage = this.selectedCameraTopic;
        UbiiClientService.instance.subscribeTopic(this.topicCameraImage, this.drawImageTopicMirror);
      }
    }
  },
  methods: {
    start: async function() {
      if (this.running) {
        return;
      }
      this.running = true;

      await UbiiClientService.instance.waitForConnection();

      await this.getImageProcessingModules();

      // set up ubii camera interface
      this.topicPrefix = '/' + UbiiClientService.instance.getClientID() + '/image-processing';
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
      let topicListReply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
      });
      this.cameraTopics = topicListReply.stringList.elements.filter(
        topic => topic.includes('camera_image') || topic.includes('camera-image')
      );
      this.cameraTopics.push('none');
    },
    getImageProcessingModules: async function() {
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
      if (reply && reply.processingModuleList) {
        this.imageProcessingModules = reply.processingModuleList.elements;
      }
    },
    onPmSelected: function(selectedOption) {
      this.selectedProcessingModuleDescription = selectedOption.description;
    },
    toggleProcessing: function() {
      this.processing = !this.processing;

      if (this.processing) {
        this.textProcessingButton = 'Stop';
        this.object2DDivs = [];

        this.topicObject2DList = this.topicPrefix + '/objects';

        UbiiClientService.instance.subscribeTopic(this.topicObject2DList, this.handleObject2DList.bind(this));

        this.runningSession = new ImageProcessingSession(
          this.topicCameraImage,
          this.topicObject2DList,
          this.selectedProcessingModule
        );
        this.runningSession.startSession();
      } else {
        this.textProcessingButton = 'Start';
        this.runningSession && this.runningSession.stopSession();

        while (this.imageTopicDisplayOverlay.hasChildNodes()) {
          this.imageTopicDisplayOverlay.removeChild(
            this.imageTopicDisplayOverlay.childNodes[0]
          );
        }
      }
    },
    /* interface methods */
    drawImageTopicMirror: function(image) {
      this.drawImage(image, this.imageTopicDisplay);
    },
    drawImage: async function(image, canvas) {
      if (!image || !canvas) {
        return;
      }

      // adjust overlay element
      this.imageTopicDisplayOverlay.style.width = this.imageTopicDisplay.clientWidth + 'px';
      this.imageTopicDisplayOverlay.style.height = this.imageTopicDisplay.clientHeight + 'px';

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
    },
    handleObject2DList(object2DList) {
      let outputObjects = object2DList.elements;

      while (this.object2DDivs.length < outputObjects.length) {
        let divElement = document.createElement('div');
        divElement.style.color = 'black';
        divElement.style.border = '5px solid rgba(255, 255, 0, 0.4)';
        divElement.style.position = 'relative';
        divElement.style.textAlign = 'left';
        divElement.style.fontWeight = 'bold';
        this.imageTopicDisplayOverlay.appendChild(divElement);
        this.object2DDivs.push(divElement);
      }

      let overlayBoundings = this.imageTopicDisplayOverlay.getBoundingClientRect();
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

.canvas-image-topic-mirror {
  grid-area: image-mirror;
  width: 100%;
}

.output-object-list-overlay {
  grid-area: image-mirror;
  justify-self: center;
  overflow: hidden;
}

.object-detection-label {
  position: relative;
  background-color: yellow;
  color: black;
}
</style>
