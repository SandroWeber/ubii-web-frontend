<template>
  <div>
    <font-awesome-icon
      class="expand-icon"
      v-show="!expanded"
      icon="chevron-right"
      @click="toggleTopicDataDisplay(topic)"
    />
    <font-awesome-icon
      class="expand-icon"
      v-show="expanded"
      icon="chevron-down"
      @click="toggleTopicDataDisplay(topic)"
    />
    {{topic}}
    <div class="topic-data green-accent" v-show="expanded">{{data}}</div>
  </div>
</template>

<script>
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronRight,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
library.add(faChevronRight, faChevronDown);

export default {
  name: 'TopicViewer',
  mounted: function() {},
  props: {
    topic: { type: String, default: '' }
  },
  data: () => {
    return { expanded: false, data: undefined };
  },
  methods: {
    toggleTopicDataDisplay() {
      this.expanded = !this.expanded;
      if (this.expanded) {
        this.data = '... no data received yet ...';
        UbiiClientService.client.subscribe(this.topic, data => {
          this.data = data;
        });
      } else {
        UbiiClientService.client.unsubscribe(this.topic);
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

.topic-data {
  color: ;
  padding-left: 30px;
}
</style>
