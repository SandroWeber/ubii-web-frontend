<template>
  <div class="client-list-wrapper">
    <div class="client" v-for="client in clientListActive" :key="client.id">
      <ubii-client-viewer :client="client" />
    </div>
    <div>
      <button @click="toggleListUnresponsive()">
        <div v-show="!showUnresponsive">Show unresponsive clients</div>
        <div v-show="showUnresponsive">Hide unresponsive clients</div>
      </button>
      
      <div v-show="showUnresponsive" class="client" v-for="client in clientListUnresponsive" :key="client.id">
        <ubii-client-viewer :client="client" />
      </div>
    </div>
  </div>
</template>

<script>
import { proto } from '@tum-far/ubii-msg-formats';
const CLIENT_STATE = proto.ubii.clients.Client.State;
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
library.add(faChevronRight, faChevronDown);

import UbiiClientViewer from './UbiiClientViewer';

export default {
  name: 'ClientDeviceComponentInspector',
  components: {
    UbiiClientViewer
  },
  data: () => {
    return {
      expanded: false,
      clientListActive: undefined,
      clientListUnresponsive: undefined,
      showUnresponsive: false
    };
  },
  mounted: async function() {
    await UbiiClientService.instance.waitForConnection();
    this.getClientList();
    this.intervalPollClientList = setInterval(() => this.getClientList(), 3000);
  },
  beforeDestroy: function() {
    this.intervalPollClientList && clearInterval(this.intervalPollClientList);
  },
  methods: {
    toggleListUnresponsive() {
      this.showUnresponsive = !this.showUnresponsive;
    },
    getClientList: async function() {
      let reply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.CLIENT_GET_LIST
      });

      if (reply.clientList) {
        this.clientListActive = reply.clientList.elements.filter(client => client.state === CLIENT_STATE.ACTIVE);
        this.clientListUnresponsive = reply.clientList.elements.filter(client => client.state !== CLIENT_STATE.ACTIVE);
      }
    }
  }
};
</script>

<style scoped>
.expand-icon {
  width: 20px;
  cursor: pointer;
}

.topic-title {
  font-size: 1.2em;
  display: inline;
  margin: 10px;
}

.client-list-wrapper {
  padding: 15px;
  overflow: scroll;
}

.client {
  padding-bottom: 10px;
}
</style>
