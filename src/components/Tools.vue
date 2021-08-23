<template>
  <div>
    <div class="tile-menu-list">
      <router-link to="/tools/topic-inspector" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="eye" class="tile-menu-icon" />
          <p>Service & Topic Inspector</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/client-inspector" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="eye" class="tile-menu-icon" />
          <p>Client, Device & Component Inspector</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/performance_tests" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="stopwatch" class="tile-menu-icon" />
          <p>Performance Tests</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/qrcode_display" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="qrcode" class="tile-menu-icon" />
          <p>QRCode Display</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/topic-publisher" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="paper-plane" class="tile-menu-icon" />
          <p>Topic Publisher</p>
        </app-tile>
      </router-link>
    </div>
  </div>
</template>

<script>
import { AppTile } from './appComponents/appComponents.js';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faEye,
  faStopwatch,
  faQrcode,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
library.add(faEye, faStopwatch, faQrcode, faPaperPlane);

export default {
  name: 'Tools',
  components: {
    AppTile
  }
};
</script>

<style scoped lang="stylus">

@import '../styles/tile-menu';

</style>
