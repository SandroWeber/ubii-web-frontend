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
    <div class="device">{{ device.name + ' (' + device.id + ')' }}</div>

    <div v-if="expanded" class="components">
      <div><b>Components:</b></div>
      <div v-for="component in device.components" :key="component.id">
        <ubii-component-viewer :component="component" />
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

import UbiiComponentViewer from './UbiiComponentViewer';

export default {
  name: 'UbiiDeviceViewer',
  props: {
    device: { type: Object, default: undefined }
  },
  components: {
    UbiiComponentViewer
  },
  data: () => {
    return { expanded: false };
  },
  methods: {
    toggleDetails() {
      this.expanded = !this.expanded;
    }
  }
};
</script>

<style scoped>
.expand-icon {
  width: 20px;
  cursor: pointer;
}

.device {
  font-size: 1.2em;
  display: inline;
  margin: 10px;
}

.components {
  padding-top: 5px;
  padding-left: 20px;
}
</style>
