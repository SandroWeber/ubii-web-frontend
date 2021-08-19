<template>
  <div>
    <UbiiClientContent :ubiiClientService="ubiiClientService">
      <Visualizer ref="visualizer"></Visualizer>
    </UbiiClientContent>
  </div>
</template>

<script>
import Visualizer from './Visualizer.vue';

import UbiiClientContent from '../../applications/sharedModules/UbiiClientContent';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default {
  name: 'SessionEditor',
  components: {
    Visualizer: Visualizer,
    UbiiClientContent
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService.instance
    };
  },
  mounted: function() {
    // unsubscribe before page is suddenly closed
    window.addEventListener('beforeunload', () => {
      this.stopEditor();
    });

    // some event hooks to restart/stop the experiment if necessary
    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.stopEditor();
      this.startEditor();
    });

    // make sure we're connected, then start the example
    UbiiClientService.instance.waitForConnection().then(() => {
      this.startEditor();
    });

    UbiiClientService.instance.onDisconnect(() => {
      this.stopEditor();
    });
  },
  beforeDestroy: function() {
    this.stopEditor();
  },
  methods: {
    startEditor: function() {
      // subscribe to session info topic
      UbiiClientService.instance.subscribeTopic(
        DEFAULT_TOPICS.INFO_TOPICS.NEW_SESSION,
        this.handleSessionInfo
      );
    },
    stopEditor: async function() {
      // unsubscribe and stop session
      UbiiClientService.instance.unsubscribeTopic(
        DEFAULT_TOPICS.INFO_TOPICS.NEW_SESSION,
        this.handleSessionInfo
      );
      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.$data.ubiiSession
      });

      if (this.$data.ubiiDevice) {
        await UbiiClientService.instance.deregisterDevice(this.$data.ubiiDevice);
      }
    },
    handleSessionInfo: function(sessionInfo) {
      this.$refs.visualizer.update(sessionInfo);
    }
  }
};
</script>

<style scoped lang="stylus"></style>
