<template>
    <div>
        <div v-show="!ubiiClientService.isConnected">
            <span class="notification">Please connect to backend before starting the application.</span>
        </div>

        <div v-show="topicList">
            <div v-for="topic in topicList" :key="topic">
                {{topic}}
            </div>
        </div>
    </div>
</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

  export default {
    name: 'TopicInspector',
    mounted: function() {
      UbiiClientService.connect()
        .then(() => {
          this.getTopicList();
        })
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService,
        topicList: undefined
      }
    },
    methods: {
      getTopicList: function() {
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
        })
          .then((reply) => {
            this.$data.topicList = reply.stringList.list;
          })
      }
    }
  }
</script>

<style scoped lang="stylus">

</style>
