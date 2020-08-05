<template>
  <app-layer
    class="header-wrapper layer-two background low-contrast horizontal-shadow"
  >
    <h3>Ubi-Interact Web Frontend</h3>
    <app-button
      :class="connectionStatusClass"
      @click="onButtonConnectionStatus"
    >
      <font-awesome-icon
        icon="plug"
        class="icon"
        v-b-tooltip.hover
        title="Server Connection Config"
      />
    </app-button>
    <server-status v-if="showConnectionSettings" class="connection-settings" />
  </app-layer>
</template>

<script>
import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
import { AppLayer, AppButton } from './appComponents/appComponents.js';
import ServerStatus from './ServerStatus.vue';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlug, faCog } from '@fortawesome/free-solid-svg-icons';
library.add(faPlug, faCog);

export default {
  name: 'PageHeader',
  components: {
    AppLayer,
    AppButton,
    ServerStatus
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      showConnectionSettings: false
    };
  },
  computed: {
    connectionStatusClass: function() {
      let connected = UbiiClientService.isConnected();
      return {
        button: true,
        round: true,
        'green-accent': connected,
        'red-accent': !connected
      };
    }
  },
  methods: {
    onButtonConnectionStatus: function() {
      this.showConnectionSettings = !this.showConnectionSettings;
    }
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

.icon {
  height: 1.5em;
  width: 1.5em;
}

.button {
  position: relative;
  align-items: center;
  height: 2em;
  width: 2em;
  padding-top: 0.2em;
}

.connection-settings {
  position: absolute;
  top: 3em;
  right: 0.1em;
}
</style>
