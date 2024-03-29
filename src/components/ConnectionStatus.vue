<template>
  <div class="connection-status-wrapper">
    <app-button
      class="button round"
      :class="connected ? 'green-accent' : 'red-accent'"
      @click="onButtonConnectionStatus"
    >
      <font-awesome-icon
        icon="plug"
        class="icon"
        v-b-tooltip.hover
        title="Connection Config"
      />
    </app-button>
    <div
      v-if="showConnectionSettings"
      class="server-info connection-settings background layer-two"
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
        class="round button-connect"
        :contentSizePercentage="60"
        @click="onButtonConnect"
        v-b-tooltip.hover
        :title="connected ? 'disabled, already connected' : ''"
        >{{ connected ? 'reconnect' : 'connect' }}</app-button
      >
    </div>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import {
  AppButton,
  AppInput
} from './appComponents/appComponents.js';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
library.add(faPlug);

export default {
  name: 'ConnectionStatus',
  components: {
    AppButton,
    AppInput
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService.instance,
      connected: UbiiClientService.instance.isConnected(),
      showConnectionSettings: false
    };
  },
  mounted: function() {
    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.onConnectionChange(true);
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.onConnectionChange(false);
    });
  },
  methods: {
    onButtonConnect: function() {
      if (!UbiiClientService.instance.isConnected()) {
        let id = UbiiClientService.instance.getClientID();
        if (id && id.length > 0) {
          UbiiClientService.instance.reconnect();
        } else {
          UbiiClientService.instance.connect();
        }
      }
    },
    onButtonConnectionStatus: function() {
      this.showConnectionSettings = !this.showConnectionSettings;
    },
    onConnectionChange: function(connected) {
      this.connected = connected;
    }
  }
};
</script>

<style scoped>
.connection-status-wrapper {
  position: absolute;
  top: 5px;
  right: 5px;
}

.connection-info {
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

.button-connect {
  color: white;
  grid-area: button-connect;
  height: 1.8em;
  width: 8em;
  margin: 2px 10px 2px 10px;
}

.connection-settings {
  position: absolute;
  top: 3em;
  right: 0.1em;
}
</style>
