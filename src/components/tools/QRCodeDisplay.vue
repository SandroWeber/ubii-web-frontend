<template>
  <div>
    <p>Web Frontend over Wifi</p>
    <br/>
    <canvas id="qrcode-canvas-wlan"></canvas>
  </div>
</template>

<script>
  import QRCode from "qrcode";
  import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';

/* eslint-disable no-console */

export default {
  name: "QRCodeDisplay",
  data: () => {
    return {};
  },
  mounted() {
    let canvas = document.getElementById('qrcode-canvas-wlan');
    let url = UbiiClientService.client.serverSpecification.ipWlan + ':' + location.port

    QRCode.toCanvas(canvas, url, {width: 500},
      (error) => {
      if (error) console.error(error);
    });
  }
};
</script>

<style scoped lang="stylus">
</style>
