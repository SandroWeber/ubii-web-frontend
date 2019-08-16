<template>
  <div>
    <div class="grid">
      <router-link to="/interfaces/smart-device" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="mobile-alt" class="interface-icon" />
          <p>Smart Device</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/ubii-controller" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="gamepad" class="interface-icon"/>
          <p>Ubii Controller</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/camera" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="camera" class="interface-icon" />
          <p>Camera</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces/myo" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="ring" class="interface-icon"/>
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
import { faMobileAlt, faCamera, faRing, faGamepad } from '@fortawesome/free-solid-svg-icons';
library.add(faMobileAlt, faCamera, faRing, faGamepad);

export default {
  name: 'Interfaces',
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

.info {
  text-align: center;
  width: 100%;
}
</style>
