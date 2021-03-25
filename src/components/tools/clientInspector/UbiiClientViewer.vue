<template>
  <div>
    <font-awesome-icon
      class="expand-icon"
      v-show="!expanded"
      icon="chevron-right"
      @click="toggleDetails()"
    />
    <font-awesome-icon
      class="expand-icon"
      v-show="expanded"
      icon="chevron-down"
      @click="toggleDetails()"
    />
    <div class="client">{{ client.name + ' (' + client.id + ')' }}</div>
    <div
      class="state-signal"
      v-bind:class="{
        active: client.state === CLIENT_STATE_ACTIVE,
        inactive: client.state === CLIENT_STATE_INACTIVE,
        unavailable: client.state === CLIENT_STATE_UNAVAILABLE
      }"
      v-bind:title="getStateString()"
    ></div>

    <div v-if="expanded" class="devices">
      <div><b>Devices:</b></div>
      <div v-for="device in client.devices" :key="device.id">
        <ubii-device-viewer :device="device" />
      </div>
    </div>
  </div>
</template>

<script>
/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronRight,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
library.add(faChevronRight, faChevronDown);

import { proto } from '@tum-far/ubii-msg-formats';
const CLIENT_STATE_ACTIVE = proto.ubii.clients.Client.State.ACTIVE;
const CLIENT_STATE_INACTIVE = proto.ubii.clients.Client.State.INACTIVE;
const CLIENT_STATE_UNAVAILABLE = proto.ubii.clients.Client.State.UNAVAILABLE;

import UbiiDeviceViewer from './UbiiDeviceViewer';

export default {
  name: 'UbiiClientViewer',
  props: {
    client: { type: Object, default: undefined }
  },
  components: {
    UbiiDeviceViewer
  },
  data: () => {
    return { expanded: false };
  },
  created: function() {
    this.CLIENT_STATE_ACTIVE = CLIENT_STATE_ACTIVE;
    this.CLIENT_STATE_INACTIVE = CLIENT_STATE_INACTIVE;
    this.CLIENT_STATE_UNAVAILABLE = CLIENT_STATE_UNAVAILABLE;
  },
  methods: {
    toggleDetails() {
      this.expanded = !this.expanded;
    },
    getStateString() {
      return proto.ubii.clients.Client.State[this.client.state];
    }
  }
};
</script>

<style scoped>
.expand-icon {
  width: 20px;
  cursor: pointer;
}

.state-signal {
  height: 15px;
  width: 15px;
  margin-left: 5px;
  margin-right: 5px;
  background-color: #bbb;
  border-radius: 50%;
  display: inline-block;
}

.active {
  background-color: green;
}

.inactive {
  background-color: yellow;
}

.unavailable {
  background-color: red;
}

.client {
  font-size: 1.2em;
  display: inline;
  margin: 10px;
}

.devices {
  padding-top: 5px;
  padding-left: 20px;
}
</style>
