<template>
  <div>
    <video id="video" width="640" height="480" autoplay></video>
    <canvas id="canvas" width="640" height="480"></canvas>
  </div>
</template>

<script>
import Vue from 'vue';

import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import UbiiEventBus from '../../services/ubiiClient/ubiiEventBus';

/* eslint-disable no-console */

export default {
  name: 'Interface-Camera',
  mounted: function() {
    var video = document.getElementById('video');

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
  methods: {}
};
</script>

<style scoped lang="stylus"></style>
