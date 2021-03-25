<template>
  <div class='client-list-wrapper'>
    <div
      class="client"
      v-for="client in clientList"
      :key="client.id"
    >
      <ubii-client-viewer
        :client="client"
      />
    </div>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronRight,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
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
      clientList: undefined
    };
  },
  mounted: function() {
    UbiiClientService.waitForConnection().then(() => {
      this.getClientList();
      this.intervalPollClientList = setInterval(() => this.getClientList(), 3000);
    });
  },
  beforeDestroy: function() {
    this.intervalPollClientList && clearInterval(this.intervalPollClientList);
  },
  methods: {
    toggleClientDetails() {
      this.expanded = !this.expanded;
    },
    getClientList: function() {
      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.CLIENT_GET_LIST
      }).then(reply => {
        this.$data.clientList = reply.elements;
      });
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
}

.client {
  padding-bottom: 10px;
}
</style>
