<template>
  <div>
    <div class="tile-menu-list">
      <router-link to="/tests/performance_tests" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow yellow-accent">
          <font-awesome-icon icon="stopwatch" class="tile-menu-icon" />
          <p>Performance Tests</p>
        </app-tile>
      </router-link>
    </div>
  </div>
</template>

<script>
import { AppTile } from '../appComponents/appComponents.js';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import { faStopwatch } from '@fortawesome/free-solid-svg-icons';
library.add(faStopwatch);

export default {
  name: 'Tests',
  components: {
    AppTile
  }
};
</script>

<style scoped lang="stylus">

@import '../../styles/tile-menu';
</style>
