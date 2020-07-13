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
import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default {
  name: 'SessionEditor',
  components: {
    Visualizer: Visualizer,
    UbiiClientContent
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService
    };
  },
  mounted: function() {
    // unsubscribe before page is suddenly closed
    window.addEventListener('beforeunload', () => {
      this.stopEditor();
    });

    // some event hooks to restart/stop the experiment if necessary
    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stopEditor();
      this.startEditor();
    });

    // make sure we're connected, then start the example
    UbiiClientService.isConnected().then(() => {
      this.startEditor();
    });

    UbiiClientService.onDisconnect(() => {
      this.stopEditor();
    });
  },
  beforeDestroy: function() {
    this.stopEditor();
  },
  methods: {
    startEditor: function() {
      // subscribe to session info topic
      UbiiClientService.subscribe(
        DEFAULT_TOPICS.INFO_TOPICS.NEW_SESSION,
        sessionInfo => {
          this.$refs.visualizer.update(sessionInfo);
        }
      );
    },
    stopEditor: async function() {
      // unsubscribe and stop session
      UbiiClientService.unsubscribe(this.$data.outputServerPointer.topic);
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.$data.ubiiSession
      });

      if (this.$data.ubiiDevice) {
        await UbiiClientService.deregisterDevice(this.$data.ubiiDevice);
      }
    }
  }
};
</script>

<style scoped lang="stylus"></style>
