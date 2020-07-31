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
    <div class="topic-title">{{topic}}</div>
    <div class="topic-data green-accent" v-show="expanded && topicData">{{topicData}}</div>
    <div class="topic-data red-accent" v-show="expanded && !topicData">received empty data</div>
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

export default {
  name: 'TopicViewer',
  props: {
    topic: { type: String, default: '' },
    topicData: { type: String, default: '... no data received yet ...' }
  },
  data: () => {
    return { expanded: false };
  },
  methods: {
    toggleTopicDataDisplay() {
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

.topic-title {
  font-size: 1.2em;
  display: inline;
  margin: 10px;
}

.topic-data {
  padding-left: 40px;
}
</style>
