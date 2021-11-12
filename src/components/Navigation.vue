<template>
  <app-layer class="navigation-wrapper layer-one background border shadow">
    <nav class="navigation-bar">
      <router-link to="/" class="navigation-item">Home</router-link>|
      <router-link to="/administration" class="navigation-item">Administration</router-link>
      | <router-link to="/tools" class="navigation-item">Tools</router-link> |
      <router-link to="/tests" class="navigation-item">Tests</router-link> |
      <router-link to="/interfaces" class="navigation-item">Interfaces</router-link> |<router-link
        to="/applications"
        class="navigation-item"
        >Applications</router-link
      >
    </nav>
  </app-layer>
</template>

<script>
import { AppLayer } from './appComponents/appComponents.js';
import ServerStatus from './ServerStatus.vue';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
library.add(faPlug);

export default {
  name: 'Navigation',
  components: {
    AppLayer,
    ServerStatus
  }
};
</script>

<style scoped>
.navigation-bar {
  padding: 15px;
  text-align: center;
}

.navigation-item {
  padding: 0px 20px 0px 20px;
  text-decoration: none;
}

.navigation-wrapper {
  flex-grow: 0;
}
</style>
