<template>
  <div>
    <p>Web Frontend over Wifi</p>
    <p class="warning" v-show="urlWlan === undefined">No Wifi Address!</p>
    <p v-show="urlWlan !== undefined">{{urlWlan}}</p>
    <br>
    <canvas id="qrcode-canvas-wlan"></canvas>
  </div>
</template>

<script>
import QRCode from "qrcode";
import UbiiClientService from "../../services/ubiiClient/ubiiClientService.js";

/* eslint-disable no-console */

export default {
  name: "QRCodeDisplay",
  data() {
    return {
      ubiiClientService: UbiiClientService,
      urlWlan: undefined
    };
  },
  mounted() {
    if (UbiiClientService.client.serverSpecification.ipWlan.length > 0) {
      let canvas = document.getElementById("qrcode-canvas-wlan");
      
      this.urlWlan = UbiiClientService.client.serverSpecification.ipWlan +
        ":" +
        location.port;

      QRCode.toCanvas(canvas, this.urlWlan, { width: 500 }, error => {
        if (error) console.error(error);
      });
    }
  }
};
</script>

<style scoped lang="stylus">
  .warning
    color: red
</style>
