<template>
  <app-layer
    class="backend-info layer-two background low-contrast horizontal-shadow"
  >
    <label for="server-ip" class="label-server-ip">Server IP</label>
    <app-input
      :id="'server-ip'"
      class="input-server-ip"
      :type="'text'"
      v-model="ubiiClientService.serverIP"
    />
    <label for="server-port" class="label-server-port">Server Port</label>
    <app-input
      :id="'server-port'"
      class="input-server-port"
      :type="'text'"
      v-model="ubiiClientService.serverPort"
    />
    <app-button
      :class="buttonConnectClass"
      :contentSizePercentage="60"
      :disabled="ubiiClientService.isConnected()"
      @click="onButtonConnect"
    >
      {{ buttonConnectActionString }}
    </app-button>
  </app-layer>
</template>

<script>
import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
import {
  AppButton,
  AppLayer,
  AppInput
} from './appComponents/appComponents.js';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
library.add(faPlug);

export default {
  name: 'ServerStatus',
  components: {
    AppButton,
    AppLayer,
    AppInput
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService
    };
  },
  computed: {
    buttonConnectClass: function() {
      let connected = UbiiClientService.isConnected();
      return {
        'button-connect': true,
        round: true,
        'green-accent': connected,
        'red-accent': !connected
      };
    },
    buttonConnectActionString: function() {
      let connected = UbiiClientService.isConnected();
      if (connected) {
        return 'reconnect';
      } else {
        return 'connect';
      }
    }
  },
  methods: {
    onButtonConnect: function() {
      if (!UbiiClientService.isConnected()) {
        let id = UbiiClientService.getClientID();
        if (id && id.length > 0) {
          UbiiClientService.reconnect();
        } else {
          UbiiClientService.connect();
        }
      }
    }
  }
};
</script>

<style scoped>
.backend-info {
  padding: 8px;
  display: grid;
  grid-gap: 5px;
  padding: 5px;
  align-items: center;
  grid-template-rows: 30px 30px 30px;
  grid-template-columns: 100px 1fr;
  grid-template-areas:
    'label-server-ip input-server-ip'
    'label-server-port input-server-port'
    'none button-connect';
}

.label-server-ip {
  grid-area: label-server-ip;
}

.label-server-port {
  grid-area: label-server-port;
}

.input-server-ip {
  grid-area: input-server-ip;
}

.input-server-port {
  grid-area: input-server-port;
}

label {
  margin: 0px 5px 0px 10px;
}

input {
  padding: 1px 5px 1px 5px;
}

.button-connect {
  grid-area: button-connect;
  height: 1.8em;
  width: 8em;
  margin: 2px 10px 2px 10px;
}
</style>
