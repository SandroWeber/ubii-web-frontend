<template>
  <app-layer class="canvas layer-two background horizontal-shadow">
    <div class="grid">
      <router-link to="/administration" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow green-accent">
          <font-awesome-icon icon="cogs" class="interface-icon" />
          <p>Administration</p>
        </app-tile>
      </router-link>

      <router-link to="/tools" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="toolbox" class="interface-icon" />
          <p>Tools</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow blue-accent">
          <font-awesome-icon icon="link" class="interface-icon" />
          <p>Interfaces</p>
        </app-tile>
      </router-link>

      <router-link to="/applications" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow purple-accent">
          <font-awesome-icon icon="play-circle" class="interface-icon" />
          <p>Applications</p>
        </app-tile>
      </router-link>
    </div>
  </app-layer>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCogs,
  faToolbox,
  faLink,
  faPlayCircle
} from '@fortawesome/free-solid-svg-icons';
library.add(faCogs, faToolbox, faLink, faPlayCircle);

import { AppLayer, AppTile } from './appComponents/appComponents.js';

export default {
  name: 'EntryPage',
  components: {
    AppTile,
    AppLayer
  }
};
</script>

<style scoped lang="stylus">
.canvas {
  height: 100%;
  padding: 25px;
}

.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
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
