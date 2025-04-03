<template>
  <div class="topic-list-grid">
    <div class="category-header header-services orange-accent">Services</div>

    <div class="category-content content-services" v-show="serviceList">
      <div class="list-element" v-for="service in serviceList" :key="service.topic">
        <service-viewer
          :topic="service.topic"
          :requestMessageFormat="service.requestMessageFormat"
          :responseMessageFormat="service.responseMessageFormat"
        />
      </div>
    </div>

    <div class="category-header header-topicdata orange-accent">Topic Data</div>

    <div class="category-content content-device-topicdata">
      <div class="list-element" v-for="topic in dataTopicList" :key="topic">
        <topic-data-viewer :topic="topic" />
      </div>
    </div>
  </div>
</template>

<script>
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
  mounted: async function() {
    await UbiiClientService.instance.waitForConnection();

    this.intervalUpdateTopicList = setInterval(this.updateTopicList, 1000);
    this.getServiceList();

    this.open = true;
  },
  beforeDestroy: function() {
    this.intervalUpdateTopicList && clearInterval(this.intervalUpdateTopicList);
    this.open = false;
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService.instance,
      serviceList: [],
      serviceTopicList: [],
      dataTopicList: []
    };
  },
  methods: {
    updateTopicList: async function() {
      let reply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
      });
      let topics = reply.stringList.elements;
      this.dataTopicList = topics.filter(topic => !topic.includes('/services/'));
      this.serviceTopicList = topics.filter(topic => {
        return topic.indexOf('/services/') === 0;
      });
    },
    getServiceList: function() {
      UbiiClientService.instance
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.SERVICE_LIST
        })
        .then(reply => {
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
  grid-template-rows: auto 1fr auto 1fr;
  grid-template-columns: 1fr;
  grid-gap: 15px;
  padding: 10px;
  grid-template-areas: 'header-topicdata' 'content-topicdata' 'header-services' 'content-services';
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
