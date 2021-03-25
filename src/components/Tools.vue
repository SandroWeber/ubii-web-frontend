<template>
  <div>
    <div class="grid">
      <router-link to="/tools/topic-inspector" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="eye" class="interface-icon" />
          <p>Service & Topic Inspector</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/client-inspector" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="eye" class="interface-icon" />
          <p>Client, Device & Component Inspector</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/performance_tests" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="stopwatch" class="interface-icon" />
          <p>Performance Tests</p>
        </app-tile>
      </router-link>

      <router-link to="/tools/qrcode_display" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="qrcode" class="interface-icon" />
          <p>QRCode Display</p>
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
  faQrcode
} from '@fortawesome/free-solid-svg-icons';
library.add(faEye, faStopwatch, faQrcode);

export default {
  name: 'Tools',
  components: {
    AppTile
  }
};
</script>

<style scoped lang="stylus">
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin: 25px;
}

.interface-link {
  text-align: center;
  cursor: pointer;
}

.interface-icon {
  width: 50px;
  height: 50px;
}
</style>
