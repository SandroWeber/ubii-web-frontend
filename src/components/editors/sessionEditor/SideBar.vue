<template>
  <div class="side-bar" id="side-bar" v-if="datasets.length > 0">
    <div class="side-bar-top">
      Dataset: {{ dataset.name }}
      <br />
      Nodes: {{ dataset.nodes.length }}
    </div>
    <side-bar-item
      :id="'0'"
      :title="'Datasets'"
      :desc="'Choose the dataset you want to display.'"
      :content="datasets.filter(ds => !ds.test)"
    >
      <list-item
        v-for="ds in datasets.filter(ds => !ds.test)"
        :key="ds.id"
        :id="ds.id"
        :selected="isSelected(ds)"
        :normal="true"
        :list_item="2"
        @change="change"
      >
        <span>
          <span>{{ ds.name }}</span>
          <br />
          <span class="small">{{ ds.id }}</span>
        </span>
      </list-item>
    </side-bar-item>
    <side-bar-item
      :id="'1'"
      :title="'Nodes in Dataset'"
      :desc="'Choose a node on which you want to focus.'"
      :content="dataset.nodes"
    >
      <list-item
        v-for="node in dataset.nodes"
        :selected="isSelectedNode(node)"
        :key="node.id"
        :id="node.id"
        :normal="true"
        :list_item="1"
        @change="change('viewNode', node.id)"
        >{{ node.name }}</list-item
      >
    </side-bar-item>
    <side-bar-item :id="'2'" :title="'Inspector for selected Node '">
      <NodeInspector :dataset="dataset" :settings="settings"></NodeInspector>
    </side-bar-item>
    <side-bar-item
      :id="'2'"
      :title="'Settings'"
      :desc="'Change various options about the visualization.'"
    >
      <settings-container
        :dataset="dataset"
        :settings="settings"
        @change="change"
        @addDataset="addDataset"
      ></settings-container>
    </side-bar-item>
    <side-bar-item
      :id="'3'"
      :title="'Test-Datasets'"
      :desc="'Choose a made-up dataset for testing.'"
      :content="datasets.filter(ds => ds.test)"
    >
      <list-item
        v-for="ds in datasets.filter(ds => ds.test)"
        :selected="isSelected(ds)"
        :key="ds.id"
        :normal="false"
        :list_item="0"
        :id="ds.id"
      >
        {{ ds.name }}
        <b-button
          v-bind:style="'margin-left: 20px;'"
          v-if="!isSelected(ds)"
          @click="change('dataset', ds.id)"
          variant="outline-primary"
          >Show</b-button
        >
      </list-item>
    </side-bar-item>
  </div>
</template>

<script>
import ListItem from './ListItem';
import SideBarItem from './SideBarItem';
import NodeInspector from './NodeInspector';
import SettingsContainer from './SettingsContainer';

import { BButton } from 'bootstrap-vue';

export default {
  name: 'SideBar',
  components: {
    SettingsContainer,
    SideBarItem,
    ListItem,
    NodeInspector,
    'b-button': BButton
  },
  props: {
    settings: {
      type: Object
    },
    datasets: {
      type: Array
    }
  },
  computed: {
    dataset: function() {
      return this.datasets.find(ds => ds.id == this.settings.dataset);
    }
  },
  methods: {
    isSelectedNode: function(node) {
      return node.id === this.settings.viewNode;
    },
    isSelected: function(ds) {
      return ds.id == this.settings.dataset;
    },
    change: function(setting, value) {
      this.$emit('change', setting, value);
    },
    addDataset: function(dataset) {
      this.$emit('addDataset', dataset);
    }
  }
};
</script>

<style scoped lang="stylus">
.side-bar {
  height: 100%;
  background-color: #221F22;
  display: flex;
  flex-direction: column;
  border-right: 1px solid black;
  font-size: 1em;
}

.side-bar-top {
  padding: 0.5em 1em 0.5em 1em;
  line-height: 1.4em;
}

.button {
  margin-left: 15px;
  padding: 5px 10px;
  border: 1px solid white;
  color: white;
  letter-spacing: 1px;
  border-radius: 4px;
  background: rgb(70, 143, 255);
  background: linear-gradient(66deg, rgba(70, 143, 255, 1) 0%, rgba(0, 100, 255, 1) 57%);
}

.title {
  display: block;
  display: flex;
  flex-direction: row;
}

.small {
  font-size: 0.8em;
  font-style: italic;
}
</style>
