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
      <div class="main">
        <graph-view
          :datasets="datasets"
          :settings="settings"
          @change="change"
        ></graph-view>
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
  </div>
</template>

<script>
import Vue from 'vue';

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

<style scoped lang="stylus">
.session-editor {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
}

.main {
  box-shadow: -1px 1px 10px 0px #101010;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
}


.side-bar-instance {
  display: flex;
  flex: 0 0 300px;
}

.settings-container-instance {
  height: 240px;
}
</style>
