<template>
  <div>
    <div class="update-signal" v-bind:class="{ flash: flashing }"></div>
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
    <div class="topic-title">{{ topic }}</div>
    <div class="topic-data green-accent" v-show="expanded && topicData">
      {{ topicData }}
    </div>
    <div class="topic-data red-accent" v-show="expanded && !topicData">
      received empty data
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

export default {
  name: 'TopicViewer',
  props: {
    topic: { type: String, default: '' },
    topicData: { type: String, default: '... no data received yet ...' }
  },
  data: () => {
    return { expanded: false, flashing: false };
  },
  methods: {
    toggleTopicDataDisplay() {
      this.expanded = !this.expanded;
    }
  },
  watch: {
    topicData: function() {
      this.flashing = true;
      setTimeout(() => {
        this.flashing = false;
      }, 100);
    }
  }
};
</script>

<style scoped>
.expand-icon {
  width: 15px;
  cursor: pointer;
}

.topic-title {
  font-size: 1.2em;
  display: inline;
  margin: 5px;
}

.topic-data {
  padding-left: 40px;
}

.update-signal {
  height: 15px;
  width: 15px;
  margin-right: 10px;
  background-color: #bbb;
  border-radius: 50%;
  display: inline-block;
}

.flash {
  background-color: greenyellow;
}
</style>
