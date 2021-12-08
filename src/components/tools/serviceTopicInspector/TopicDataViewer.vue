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
    <div class="topic-title">{{ topic }}</div>
    <div class="update-signal" v-show="expanded" v-bind:class="{ flash: flashing }"></div>
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
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
library.add(faChevronRight, faChevronDown);

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import util from 'util';

export default {
  name: 'TopicViewer',
  props: {
    topic: { type: String, default: '' }
  },
  data: () => {
    return { expanded: false, flashing: false, topicData: '... no data received yet ...' };
  },
  methods: {
    async toggleTopicDataDisplay() {
      this.expanded = !this.expanded;
      if (this.expanded) {
        await UbiiClientService.instance.subscribeTopic(this.topic, this.onTopicDataRecord);
      } else {
        await UbiiClientService.instance.unsubscribeTopic(this.topic, this.onTopicDataRecord);
      }
    },
    onTopicDataRecord(data) {
      this.flash();
      this.topicData = util.inspect(data);
    },
    flash() {
      this.flashing = true;
      setTimeout(() => {
        this.flashing = false;
      }, 100);
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
