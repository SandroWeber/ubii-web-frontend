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
    <div class="component">{{ component.name + ' (' + component.id + ')' }}</div>

    <div v-if="expanded" class="component-info">
      <div><b>Topic:</b> {{ component.topic }}</div>
      <div><b>Message Format:</b> {{ component.messageFormat }}</div>
      <div><b>I/O Type:</b> {{ getIOTypeString() }}</div>
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

export default {
  name: 'UbiiComponentViewer',
  props: {
    component: { type: Object, default: undefined }
  },
  data: () => {
    return { expanded: false };
  },
  methods: {
    toggleDetails() {
      this.expanded = !this.expanded;
    },
    getIOTypeString() {
      return this.component.ioType ? this.component.ioType : proto.ubii.devices.Component.IOType[0];
    }
  }
};
</script>

<style scoped>
.expand-icon {
  width: 20px;
  cursor: pointer;
}

.component {
  font-size: 1.2em;
  display: inline;
  margin: 10px;
}

.component-info {
  padding-left: 20px;
}
</style>
