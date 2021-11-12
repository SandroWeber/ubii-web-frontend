<template>
  <app-layer class="layer-two background low-contrast horizontal-shadow">
    <div class="header-wrapper">
      <h3>Ubi-Interact Web Frontend</h3>
      <server-status />
    </div>
    
    <navigation />
  </app-layer>
</template>

<script>
import { AppLayer } from './appComponents/appComponents.js';
import ServerStatus from './ServerStatus.vue';
import Navigation from './Navigation.vue';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
library.add(faPlug);

export default {
  name: 'PageHeader',
  components: {
    AppLayer,
    ServerStatus,
    Navigation
  }
};
</script>

<style scoped>
.header-wrapper {
  padding: 8px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 5px;
}
</style>
