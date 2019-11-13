<template>
  <div class="topic-list-grid">
    <div class="category-header header-services orange-accent">Services</div>
    <div class="category-header header-topicdata orange-accent">Topic Data</div>
    <div class="category-content content-services" v-show="serviceTopicList">
      <div class="topic-list-element" v-for="topic in serviceTopicList" :key="topic">{{topic}}</div>
    </div>

    <div class="category-content content-device-topicdata" v-show="topicData
    ">
      <div class="topic-list-element" v-for="(data, topic) in topicData
      " :key="topic">
        <topic-data-viewer :topic="topic" :topic-data="data" />
      </div>
    </div>
  </div>
</template>

<script>
import util from 'util';
import Vue from 'vue';

import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import TopicDataViewer from './TopicDataViewer.vue';

export default {
  name: 'TopicInspector',
  components: {
    TopicDataViewer
  },
  mounted: function() {
    UbiiClientService.isConnected().then(() => {
      this.getTopicList();
    });
    this.open = true;
  },
  beforeDestroy: function() {
    this.open = false;
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      serviceTopicList: [],
      topicData: {}
    };
  },
  methods: {
    getTopicList: function() {
      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
      }).then(reply => {
        let topics = reply.stringList.list;
        this.$data.serviceTopicList = topics.filter(topic => {
          return topic.indexOf('/services/') === 0;
        });
      });

      UbiiClientService.subscribeRegex('.*', (data, topic) => {
        Vue.set(this.topicData, topic, util.inspect(data));
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
.content-device-topicdata {
  grid-area: content-topicdata;
}

.category-content {
  overflow: auto;
}
.topic-list-element {
  padding-bottom: 3px;
}
</style>
