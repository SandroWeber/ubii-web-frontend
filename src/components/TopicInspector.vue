<template>
    <div>
        <div v-show="!ubiiClientService.isConnected">
            <span class="notification">Please connect to backend before starting the application.</span>
        </div>
    </div>
</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

  export default {
    name: 'TopicInspector',
    beforeMount: function() {
      if (UbiiClientService.isConnected) {
        console.info('beforeMount - already connected');
        this.subscribeToAllTopics();
      } else {
        console.info('beforeMount - not yet connected');
      }
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService
      }
    },
    methods: {
      subscribeToAllTopics: function() {
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST
        })
          .then((reply) => {
            console.info(reply);
          })
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
