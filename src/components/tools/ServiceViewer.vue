<template>
  <div>
    <font-awesome-icon
      class="expand-icon"
      v-show="!expanded"
      icon="chevron-right"
      @click="toggleServiceDetails()"
    />
    <font-awesome-icon
      class="expand-icon"
      v-show="expanded"
      icon="chevron-down"
      @click="toggleServiceDetails()"
    />
    {{ topic }}
    <div class="service-detail" v-show="expanded && requestMessageFormat">
      request format:
      <div class="green-accent">{{ requestMessageFormat }}</div>
    </div>
    <div class="service-detail" v-show="expanded && responseMessageFormat">
      reply format:
      <div class="green-accent">{{ responseMessageFormat }}</div>
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
import { MSG_TYPES } from '@tum-far/ubii-msg-formats';

export default {
  name: 'ServiceViewer',
  props: {
    topic: { type: String, default: '' },
    requestMessageFormat: { type: String, default: 'none' },
    responseMessageFormat: {
      type: String,
      default:
        'undefined - ' +
        MSG_TYPES.SUCCESS +
        ' and ' +
        MSG_TYPES.ERROR +
        ' probable'
    }
  },
  data: () => {
    return { expanded: false };
  },
  methods: {
    toggleServiceDetails() {
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

.service-detail {
  padding-left: 30px;
}
</style>
