<template>
  <div class="topic-list-grid">
    <div class="category-header header-services orange-accent">Services</div>
    <div class="category-header header-topicdata orange-accent">Topic Data</div>
    <div class="category-content content-services" v-show="serviceList">
      <div class="topic-list-element" v-for="topic in serviceList" :key="topic">{{topic}}</div>
    </div>

    <div class="category-content content-topicdata" v-show="topicList">
      <div class="topic-list-element" v-for="topic in topicList" :key="topic">{{topic}}</div>
    </div>
  </div>
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

<style scoped>
.topic-list-grid {
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 1fr;
  grid-gap: 15px;
  padding: 10px;
  grid-template-areas: 'header-services header-topicdata' 'content-services content-topicdata';
}
.category-header {
  border-bottom: 2px solid;
}
.header-services {
  grid-area: header-services;
}
.header-topicdata {
  grid-area: header-topicdata;
}
.content-services {
  grid-area: content-services;
}
.content-topicdata {
  grid-area: content-topicdata;
}

.category-content {
  overflow: auto;
}
.topic-list-element {
  padding-bottom: 3px;
}
</style>
