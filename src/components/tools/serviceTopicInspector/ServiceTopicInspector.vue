<template>
  <div class="topic-list-grid">
    <div class="category-header header-services orange-accent">Services</div>

    <div class="category-content content-services" v-show="serviceList">
      <div
        class="list-element"
        v-for="service in serviceList"
        :key="service.topic"
      >
        <service-viewer
          :topic="service.topic"
          :requestMessageFormat="service.requestMessageFormat"
          :responseMessageFormat="service.responseMessageFormat"
        />
      </div>
    </div>

    <div class="category-header header-topicdata orange-accent">Topic Data</div>

    <div class="category-content content-device-topicdata" v-show="topicData">
      <div class="list-element" v-for="(data, topic) in topicData" :key="topic">
        <topic-data-viewer :topic="topic" :topic-data="data" />
      </div>
    </div>
  </div>
</template>

<script>
import util from 'util';
import Vue from 'vue';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import TopicDataViewer from './TopicDataViewer.vue';
import ServiceViewer from './ServiceViewer.vue';

export default {
  name: 'ServiceTopicInspector',
  components: {
    TopicDataViewer,
    ServiceViewer
  },
  mounted: function() {
    UbiiClientService.waitForConnection().then(() => {
      this.getTopicList();
      this.getServiceList();
    });
    this.open = true;
  },
  beforeDestroy: function() {
    UbiiClientService.unsubscribeRegex(
      this.regexAllTopics,
      this.handleTopicData
    );
    this.open = false;
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      serviceList: [],
      serviceTopicList: [],
      topicData: {},
      regexAllTopics: '.*'
    };
  },
  methods: {
    getTopicList: function() {
      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
      }).then(reply => {
        let topics = reply.stringList.elements;
        this.$data.serviceTopicList = topics.filter(topic => {
          return topic.indexOf('/services/') === 0;
        });
      });

      UbiiClientService.subscribeRegex(
        this.regexAllTopics,
        this.handleTopicData
      );
    },
    handleTopicData: function(data, topic) {
      Vue.set(this.topicData, topic, util.inspect(data));
    },
    getServiceList: function() {
      UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.SERVICE_LIST
      }).then(reply => {
        let services = reply.serviceList.elements;
        this.$data.serviceList = services;
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

.list-element {
  padding-bottom: 3px;
}
</style>
