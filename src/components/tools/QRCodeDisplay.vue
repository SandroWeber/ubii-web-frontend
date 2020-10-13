<template>
  <div class="grid">
    <div>
      <p>Wifi Connection</p>
      <p class="warning" v-show="urlWlan === undefined">No Wifi Address!</p>
      <p v-show="urlWlan !== undefined">{{ urlWlan }}</p>
      <br />
      <canvas id="qrcode-canvas-wlan"></canvas>
    </div>

    <div>
      <p>Ethernet Connection</p>
      <p class="warning" v-show="urlEthernet === undefined">
        No Ethernet Address!
      </p>
      <p v-show="urlEthernet !== undefined">{{ urlEthernet }}</p>
      <br />
      <canvas id="qrcode-canvas-ethernet"></canvas>
    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

/* eslint-disable no-console */

export default {
  name: 'QRCodeDisplay',
  data() {
    return {
      ubiiClientService: UbiiClientService,
      urlWlan: undefined,
      urlEthernet: undefined
    };
  },
  mounted() {
    if (UbiiClientService.client.serverSpecification.ipWlan.length > 0) {
      let canvas = document.getElementById('qrcode-canvas-wlan');

      this.urlWlan =
        UbiiClientService.client.serverSpecification.ipWlan +
        ':' +
        location.port;

      QRCode.toCanvas(canvas, this.urlWlan, { width: 500 }, error => {
        if (error) console.error(error);
      });
    }

    if (UbiiClientService.client.serverSpecification.ipEthernet.length > 0) {
      let canvas = document.getElementById('qrcode-canvas-ethernet');

      this.urlEthernet =
        UbiiClientService.client.serverSpecification.ipEthernet +
        ':' +
        location.port;

      QRCode.toCanvas(canvas, this.urlEthernet, { width: 500 }, error => {
        if (error) console.error(error);
      });
    }
  }
};
</script>

<style scoped lang="stylus">
.warning {
  color: red;
}

.grid {
  display: grid;
  grid-gap: 25px;
  grid-template-columns: 1fr 1fr;
  margin: 25px;
}
</style>
