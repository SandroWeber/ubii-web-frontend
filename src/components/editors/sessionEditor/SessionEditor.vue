<template>
  <div>
    <UbiiClientContent :ubiiClientService="ubiiClientService">
      <div class="session-editor">
        <side-bar
          class="side-bar-instance"
          :datasets="datasets"
          :settings="settings"
          @change="change"
          @addDataset="addDataset"
        ></side-bar>
        <div class="main">
          <!--                    <top-bar class="top-bar-instance"-->
          <!--                         :dataset="session"-->
          <!--                    ></top-bar>-->

          <graph-view :datasets="datasets" :settings="settings"></graph-view>
        </div>
      </div>
    </UbiiClientContent>
  </div>
</template>

<script>
import Vue from 'vue';

import TopBar from './TopBar.vue';
import SideBar from './SideBar.vue';
import GraphView from './GraphView.vue';

import UbiiClientContent from '../../applications/sharedModules/UbiiClientContent';
import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { scenarios } from './modules/session-scenarios';

import { DataTranslator } from './modules/utils';

library.add(faPlay);

export default {
  name: 'SessionEditor',
  components: {
    TopBar: TopBar,
    SideBar: SideBar,
    GraphView: GraphView,
    UbiiClientContent
  },
  data: () => {
    return {
      scenarios: scenarios,
      datasets: [],
      ubiiClientService: UbiiClientService,
      translator: null,
      settings: {
        view: 1,
        dataset: '0',
        viewNode: -1,
        mode: 0,
        sorting: 0,
        viewZeroMarker: false,
        startNode: '0',
        slimLayers: false,
        showAll: true
      }
    };
  },
  watch: {},
  beforeMount: function() {
    this.translator = new DataTranslator();
    scenarios.forEach(scenario => {
      let translated = this.translator.translateFromUbii(scenario);
      translated.test = true;
      this.datasets.push(translated);
    });
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
    change: function(setting, value) {
      this.settings[setting] = value;
      console.log(setting + ': ' + value);
    },
    addDataset: function(dataset) {
      this.datasets.push(dataset);
    },
    startEditor: function() {
      // subscribe to session info topic
      UbiiClientService.subscribe(
        DEFAULT_TOPICS.INFO_TOPICS.NEW_SESSION,
        sessionInfo => {
          this.update(sessionInfo);
        }
      );
    },
    stopEditor: async function() {
      if (!this.exampleStarted) return;

      this.exampleStarted = false;

      // unsubscribe and stop session
      UbiiClientService.unsubscribe(this.$data.outputServerPointer.topic);
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });

      if (this.$data.ubiiDevice) {
        await UbiiClientService.deregisterDevice(this.$data.ubiiDevice);
      }
    },
    update: function(dataset) {
      this.datasets.push(this.translator.translateFromUbii(dataset));
    }
  }
};
</script>

<style scoped lang="stylus">
.main {
  flex-basis: 0;
  flex-grow: 999;
  box-shadow: -1px 1px 10px 0px #101010;
}

.session-editor {
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-items: stretch;
  align-content: flex-start;
}

.side-bar-instance {
  flex-basis: 300px;
  max-width: 350px;
}

.top-bar-instance {
  height: 200px;
}
</style>
