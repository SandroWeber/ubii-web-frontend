<template>
  <app-layer id="app" class="layer-one background">
    <div class="router-view-wrapper">
      <router-view class="router-view" />
    </div>
  </app-layer>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import { AppLayer } from './components/appComponents/appComponents.js';

export default {
  name: 'app',
  components: {
    AppLayer
  },
  mounted: () => {
    let useHTTPS = window.location.protocol.includes('https');
    UbiiClientService.instance.setHTTPS(useHTTPS);
    UbiiClientService.instance.setName('Ubi-Interact Web Frontend');
    UbiiClientService.instance.connect();
    window.addEventListener('beforeunload', () => {
      UbiiClientService.instance.disconnect();
    });
  },
  beforeDestroy: function() {
    UbiiClientService.instance.disconnect();
  }
};
</script>

<style lang="stylus">
@import './styles/main/color';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: maxContrastColor;
  overflow: hidden;
}

#server-status {
  position: relative;
}

.router-view-wrapper {
  flex-grow: 1;
  overflow: hidden;
}

.server-stats {
  text-align: center;
}

.router-view {
  height: 100%;
}

.svg-inline--fa {
  vertical-align: 0;
}

a {
  color: purpleAccentColor;
}
</style>
