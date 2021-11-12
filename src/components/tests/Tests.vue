<template>
  <div style="height: 100%">
    <page-header />

    <div class="tile-menu-list">
      <router-link to="/tests/performance_tests" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow yellow-accent">
          <font-awesome-icon icon="stopwatch" class="tile-menu-icon" />
          <p>Performance Tests</p>
        </app-tile>
      </router-link>

      <router-link to="/tests/pm_execution" class="tile-menu-item" tag="div">
        <app-tile class="layer-three background round shadow yellow-accent">
          <font-awesome-icon icon="tasks" class="tile-menu-icon" />
          <p>Processing / Execution Tests</p>
        </app-tile>
      </router-link>
    </div>
  </div>
</template>

<script>
import { AppTile } from '../appComponents/appComponents.js';
import PageHeader from '../PageHeader.vue';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import { faStopwatch, faTasks } from '@fortawesome/free-solid-svg-icons';
library.add(faStopwatch, faTasks);

export default {
  name: 'Tests',
  components: {
    AppTile,
    PageHeader
  }
};
</script>

<style scoped lang="stylus">

@import '../../styles/tile-menu';
</style>
