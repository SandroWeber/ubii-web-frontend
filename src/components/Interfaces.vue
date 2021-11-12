<template>
  <div class="wrapper-interfaces">
    <page-header />

    <div class="tile-menu-list">
      <router-link to="/interfaces/smart-device" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent tile-menu-item-background">
          <font-awesome-icon icon="mobile-alt" class="tile-menu-icon" />
          <p>Smart Device</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/ubii-controller" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent tile-menu-item-background">
          <font-awesome-icon icon="gamepad" class="tile-menu-icon" />
          <p>Ubii Controller</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/camera" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent tile-menu-item-background">
          <font-awesome-icon icon="camera" class="tile-menu-icon" />
          <p>Camera</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/ubii-gameCamera" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent tile-menu-item-background">
          <font-awesome-icon icon="camera" class="tile-menu-icon" />
          <p>Ubii Game Camera</p>
        </app-tile>
      </router-link>

      <!--<router-link to="/interfaces/myo" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent tile-menu-item-background">
          <font-awesome-icon icon="ring" class="tile-menu-icon" />
          <p>Myo</p>
        </app-tile>
      </router-link>-->
    </div>
  </div>
</template>

<script>
import { AppTile } from './appComponents/appComponents.js';
import PageHeader from './PageHeader.vue';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faMobileAlt,
  faCamera,
  faRing,
  faGamepad
} from '@fortawesome/free-solid-svg-icons';
library.add(faMobileAlt, faCamera, faRing, faGamepad);

export default {
  name: 'Interfaces',
  components: {
    AppTile,
    PageHeader
  }
};
</script>

<style scoped lang="stylus">

@import '../styles/tile-menu';

.wrapper-interfaces {
  overflow: auto;
  width: 100%;
}

.info {
  text-align: center;
  width: 100%;
}
</style>
