<template>
  <app-layer class="canvas layer-two background horizontal-shadow">
    <page-header />

    <div class="tile-menu-list">
      <router-link to="/administration" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow green-accent tile-menu-item-background">
          <font-awesome-icon icon="cogs" class="tile-menu-icon" />
          <p>Administration</p>
        </app-tile>
      </router-link>

      <router-link to="/tools" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow orange-accent tile-menu-item-background">
          <font-awesome-icon icon="toolbox" class="tile-menu-icon" />
          <p>Tools</p>
        </app-tile>
      </router-link>

      <router-link to="/tests" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow yellow-accent tile-menu-item-background">
          <font-awesome-icon icon="clipboard-list" class="tile-menu-icon" />
          <p>Tests</p>
        </app-tile>
      </router-link>

      <router-link to="/interfaces" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow blue-accent tile-menu-item-background">
          <font-awesome-icon icon="link" class="tile-menu-icon" />
          <p>Interfaces</p>
        </app-tile>
      </router-link>

      <router-link to="/applications" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
          <font-awesome-icon icon="play-circle" class="tile-menu-icon" />
          <p>Applications</p>
        </app-tile>
      </router-link>
    </div>
  </app-layer>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCogs, faToolbox, faLink, faPlayCircle, faClipboardList } from '@fortawesome/free-solid-svg-icons';
library.add(faCogs, faToolbox, faLink, faPlayCircle, faClipboardList);

import { AppLayer, AppTile } from './appComponents/appComponents.js';
import PageHeader from './PageHeader.vue';

export default {
  name: 'EntryPage',
  components: {
    AppTile,
    AppLayer,
    PageHeader
  }
};
</script>

<style scoped lang="stylus">

@import '../styles/tile-menu';

.canvas {
  height: 100%;
}
</style>
