<template>
  <app-layer class="layer-one background topic-list-grid">
    <div class="topic-list service-list" v-show="serviceList">
      <div class="category-header orange-accent">Services</div>
      <div v-for="topic in serviceList" :key="topic">{{topic}}</div>
    </div>

    <div class="topic-list topicdata-list" v-show="topicList">
      <div class="category-header orange-accent">Topic Data</div>
      <div v-for="topic in topicList" :key="topic">{{topic}}</div>
    </div>
  </app-layer>
</template>

<script>
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import { AppLayer } from '../../components/appComponents/appComponents.js';

export default {
  name: 'TopicInspector',
  components: {
    AppLayer
  },
  mounted: function() {
    UbiiClientService.connect().then(() => {
      this.getTopicList();
    });
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      serviceList: undefined,
      topicList: undefined
    };
  },
  methods: {
    getTopicList: function() {
      UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
        })
        .then(reply => {
          let topics = reply.stringList.list;
          this.$data.serviceList = topics.filter(topic => {
            return topic.indexOf('/services/') === 0;
          });
          this.$data.topicList = topics.filter(topic => {
            return topic.indexOf('/services/') === -1;
          });
        });
    }
  }
};
</script>

<style scoped lang="stylus">
.topic-list-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 15px;
  margin: 25px;
  grid-template-areas: 'grid-services grid-topicdata';
}

.category-header {
  border-bottom: 2px solid;
  margin-bottom: 10px;
}

.topic-list {
  overflow: auto;
}

.service-list {
  grid-area: grid-services;
}

.topicdata-list {
  grid-area: grid-topicdata;
}
</style>
