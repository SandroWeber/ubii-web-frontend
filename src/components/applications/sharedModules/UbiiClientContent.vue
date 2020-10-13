<template>
  <div class="full-height">
    <div v-show="!connected">
      <span class="notification"
        >Please connect to backend before starting the application.</span
      >
    </div>

    <div v-show="connected" class="full-height">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser/src/index.js';

export default {
  name: 'UbiiClientContent',
  props: {
    ubiiClientService: Object
  },
  data: () => {
    return {
      connected: false
    };
  },
  mounted: function() {
    UbiiClientService.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.connected = true;
    });
    UbiiClientService.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.connected = false;
    });

    UbiiClientService.waitForConnection().then(() => {
      this.connected = true;
    });
  }
};
</script>

<style scoped lang="stylus">
.full-height, .full-height > * {
  height: 100%;
}

.notification {
  color: red;
}
</style>
