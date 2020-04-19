<template>
  <div>
    <div class="session-editor">
      <side-bar
        class="side-bar-instance"
        :datasets="datasets"
        :settings="settings"
        @change="change"
        @addDataset="addDataset"
      ></side-bar>
      <graph-view class="graph-display" :datasets="datasets" :settings="settings" @change="change"></graph-view>
      <settings-container
        id="settings-container"
        class="settings-container-instance"
        :dataset="dataset"
        :settings="settings"
        @change="change"
        @addDataset="addDataset"
      ></settings-container>
    </div>
  </div>
</template>

<script>
import SettingsContainer from './SettingsContainer.vue';
import SideBar from './SideBar.vue';
import GraphView from './GraphView.vue';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { scenarios } from './modules/session-scenarios';

import { DataTranslator } from './modules/utils';

library.add(faPlay);

export default {
  name: 'SessionEditor',
  components: {
    SettingsContainer: SettingsContainer,
    SideBar: SideBar,
    GraphView: GraphView
  },
  data: () => {
    return {
      scenarios: scenarios,
      datasets: [],
      translator: null,
      settings: {
        graphType: 'LAYERED',
        dataset: '0001',
        viewNode: -1,
        sceneId: 'EXPLORATION',
        sorting: 0,
        viewZeroMarker: false,
        startNode: '0',
        slimLayers: false,
        showAll: true,
        snapToGrid: true
      }
    };
  },
  watch: {},
  beforeMount: function() {
    this.translator = new DataTranslator();
    scenarios.forEach(scenario => {
      this.datasets.push(scenario);
    });
  },
  computed: {
    dataset: function() {
      return this.datasets.find(ds => ds.id == this.settings.dataset);
    }
  },
  methods: {
    change: function(setting, value) {
      this.settings[setting] = value;
    },
    addDataset: function(dataset) {
      this.datasets.push(dataset);
    },
    update: function(dataset) {
      this.datasets.push(this.translator.translateFromUbii(dataset));
    }
  }
};
</script>

<style scoped>
.session-editor {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 1fr 240px;
  grid-template-areas:
    'sidebar graph-display'
    'sidebar settings';

  height: 100%;
  width: 100%;
}

.graph-display {
  grid-area: graph-display;
}

.side-bar-instance {
  grid-area: sidebar;
}

.settings-container-instance {
  grid-area: settings;
}
</style>
