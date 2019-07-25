<template>
  <div class="interface-wrapper">
    <video id="video" class="camera-image" autoplay></video>
    <button @click="onButtonCoCoSSD">coco-ssd object detection</button>
  </div>
</template>

<script>
/* eslint-disable no-console */
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

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
  },
  beforeDestroy: function() {},
  data: () => {
    return {};
  },
  methods: {
    /* ubii methods */
    createUbiiSpecs: function() {
      this.ubiiDeviceName = 'CameraWebInterface';
      let topicPrefix =
        '/' + UbiiClientService.getClientID() + '/' + ubiiDeviceName;

      this.ubiiDevice = {
        name: ubiiDeviceName,
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
    },
    /* interface methods */
    onButtonCoCoSSD: function() {
      let img = this.captureImage();
      console.info(img);
    },
    captureImage: function() {
      var canvas = document.createElement('canvas');
      canvas.height = this.videoElement.videoHeight;
      canvas.width = this.videoElement.videoWidth;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
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
</style>
