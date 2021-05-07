<template>
  <div class="wrapper-interfaces">
    <div class="menu-item-list">
      <router-link to="/interfaces/smart-device" class="menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent menu-item-background">
          <font-awesome-icon icon="mobile-alt" class="menu-icon" />
          <p>Smart Device</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/ubii-controller" class="menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent menu-item-background">
          <font-awesome-icon icon="gamepad" class="menu-icon" />
          <p>Ubii Controller</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/camera" class="menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent menu-item-background">
          <font-awesome-icon icon="camera" class="menu-icon" />
          <p>Camera</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/ubii-gameCamera" class="menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent menu-item-background">
          <font-awesome-icon icon="camera" class="menu-icon" />
          <p>Ubii Game Camera</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/myo" class="menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent menu-item-background">
          <font-awesome-icon icon="ring" class="menu-icon" />
          <p>Myo</p>
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
  faMobileAlt,
  faCamera,
  faRing,
  faGamepad
} from '@fortawesome/free-solid-svg-icons';
library.add(faMobileAlt, faCamera, faRing, faGamepad);

export default {
  name: 'Interfaces',
  components: {
    AppTile
  }
};
</script>

<style scoped lang="stylus">

.wrapper-interfaces {
  overflow: auto;
  width: 100%;
}

.menu-item-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  margin: 10px;
}

.menu-item {
  width: 125px;
  height: 125px;
  text-align: center;
  cursor: pointer;
}

.menu-item-background {
  width: 100%;
  height: 100%;
}

.menu-icon {
  margin: 10px;
  width: 25px;
  height: 25px;
}

.info {
  text-align: center;
  width: 100%;
}
</style>
