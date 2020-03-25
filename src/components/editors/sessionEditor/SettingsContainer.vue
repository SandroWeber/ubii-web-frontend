<template>
  <div class="settings-container">
    <div class="settings-group">
      <div class="settings-row">
        Import:
      </div>
      <div <div class="settings-row">
        <b-form-file
          size="sm"
          v-model="file"
          placeholder="Choose .json file"
          drop-placeholder="Drop .json file here..."
          accept=".json"
          ref="file-input"
          id="file"
        ></b-form-file>
        <b-button @click="upload" variant="outline-primary">Import</b-button>
      </div>
      <div class="settings-row">
        Graph:
      </div>
      <div <div class="settings-row">
        <b-form-select
          v-model="selectedView"
          :options="viewOptions"
          @input="changeView"
        ></b-form-select>
      </div>
    </div>
    <div class="settings-group" v-if="selectedView == 2">
      <div class="settings-row">
        Mode:
      </div>
      <div <div class="settings-row">
        <b-form-select
          v-model="selectedMode"
          :options="modeOptions"
          @input="changeMode"
        ></b-form-select>
      </div>
      <div class="settings-row">
        Explanation:
      </div>
      <div class="settings-row">
        <div class="help-container" v-if="selectedView == 2">
          <font-awesome-icon icon="question-circle" class="icon" />
          <span v-if="selectedMode == 0"
            >Explore the graph freely with 9 individually usable Layers.</span
          >
          <span v-if="selectedMode == 1">
            Sort your Nodes in Layers depending on which tags (or combination of
            tags) they reference.
          </span>
          <span v-if="selectedMode == 2">
            Sort your Nodes in Layers depending on how many edges flow into a
            node / out of a node (node degree).
          </span>
          <span v-if="selectedMode == 3">
            Sort your Nodes in Layers depending on how many steps they are away
            from your Starting Node
          </span>
        </div>
      </div>
    </div>
    <div v-if="selectedView >= 2" class="settings-group switches-right">
      <div class="settings-row" v-if="selectedView == 2">
        Always show layers:
        <toggle-button
          id="layers-show-all-toggle"
          :height="28"
          :width="90"
          :color="{ unchecked: '#406184', checked: '#388DE8' }"
          :font-size="15"
          :value="selectedShowAll"
          :labels="{ checked: 'On', unchecked: 'Off' }"
          @change="changeShowAll"
        ></toggle-button>
      </div>
      <div class="settings-row" v-if="selectedView == 2">
        Slim Layers:
        <toggle-button
          id="layer-slim-toggle"
          :height="28"
          :width="90"
          :color="{ unchecked: '#406184', checked: '#388DE8' }"
          :font-size="15"
          :value="selectedSlimLevels"
          :labels="{ checked: 'Slim', unchecked: 'Wide' }"
          @change="changeSlimLevels"
        ></toggle-button>
      </div>
      <div class="settings-row" v-if="selectedView == 2">
        Snap to Grid:
        <toggle-button
          id="layer-grid-snap-toggle"
          :height="28"
          :width="90"
          :color="{ unchecked: '#406184', checked: '#388DE8' }"
          :font-size="15"
          :value="selectedSnapToGrid"
          :labels="{ checked: 'Snap', unchecked: 'Free' }"
          @change="changeSnapToGrid"
        ></toggle-button>
      </div>
      <div class="settings-row">
        Toggle Zero Marker:
        <toggle-button
          id="marker-toggle"
          :height="28"
          :width="90"
          :color="{ unchecked: '#406184', checked: '#388DE8' }"
          :font-size="15"
          :value="selectedZeroMarker"
          :labels="{ checked: 'Visible', unchecked: 'Hidden' }"
          @change="changeZeroMarker"
        ></toggle-button>
      </div>
    </div>
    <div
      v-if="selectedView == 2 && (selectedMode == 2 || selectedMode == 3)"
      class="settings-group"
    >
      <div class="settings-row">
        <span v-if="selectedMode == 2">Sorting:</span>
        <span v-if="selectedMode == 3">Starting Node:</span>
      </div>
      <div class="settings-row">
        <b-form-select
          v-if="selectedMode == 2"
          v-model="selectedSorting"
          :options="sortingOptions"
          @input="changeSorting"
        ></b-form-select>
        <b-form-select
          v-if="selectedMode == 3"
          v-model="selectedStartNode"
          :options="startNodeOptions"
          @input="changeStartNode"
        ></b-form-select>
      </div>
    </div>
  </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import { BFormSelect, BFormGroup, BButton, BFormFile } from 'bootstrap-vue';

import { ToggleButton } from 'vue-js-toggle-button';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
library.add(faQuestionCircle);

export default {
  name: 'SettingsContainer',
  components: {
    'b-form-select': BFormSelect,
    'b-form-group': BFormGroup,
    'b-button': BButton,
    'b-form-file': BFormFile,
    'toggle-button': ToggleButton
  },
  props: {
    dataset: {
      type: Object
    },
    settings: {
      type: Object
    }
  },
  data: function() {
    return {
      selectedView: this.settings.view,
      selectedMode: this.settings.mode,
      selectedSorting: this.settings.sorting,
      selectedStartNode: this.settings.startNode,
      selectedSlimLevels: this.settings.slimLevels,
      selectedShowAll: this.settings.showAll,
      selectedZeroMarker: this.settings.viewZeroMarker,
      selectedSnapToGrid: this.settings.snapToGrid,
      viewOptions: [
        { value: 0, text: '2D Force-Graph' },
        { value: 1, text: '3D Force-Graph' },
        { value: 2, text: 'Layered Graph' },
        { value: 3, text: 'Grouped Graph' }
      ],
      modeOptions: [
        { value: 0, text: 'Browsing' },
        { value: 1, text: 'Tags' },
        { value: 2, text: 'Node Degree' },
        { value: 3, text: 'Steps' }
      ],
      sortingOptions: [
        { value: 0, text: 'Incoming Edges' },
        { value: 1, text: 'Outgoing Edges' },
        { value: 2, text: 'Incoming & Outgoing Edges' }
      ],
      startNodeOptions: [],
      file: null
    };
  },
  watch: {
    dataset: function(ds) {
      this.startNodeOptions = [];
      ds.nodes.forEach((node, index) =>
        this.startNodeOptions.push({ value: node.id, text: node.name })
      );
    }
  },
  methods: {
    init: function() {
      this.dataset.nodes.forEach((node, index) =>
        this.startNodeOptions.push({ value: node.id, text: node.name })
      );
    },
    changeView: function(view) {
      this.$emit('change', 'view', view);
    },
    changeMode: function(mode) {
      this.$emit('change', 'mode', mode);
    },
    changeSorting: function(sorting) {
      this.$emit('change', 'sorting', sorting);
    },
    changeZeroMarker: function(state) {
      this.$emit('change', 'viewZeroMarker', state.value);
    },
    changeStartNode: function(startNode) {
      this.$emit('change', 'startNode', startNode);
    },
    changeSlimLevels: function(state) {
      this.$emit('change', 'slimLayers', state.value);
    },
    changeShowAll: function(state) {
      this.$emit('change', 'showAll', state.value);
    },
    changeSnapToGrid: function(state) {
      this.$emit('change', 'snapToGrid', state.value);
    },
    upload: function() {
      if (this.file != null) {
        this.file.text().then(text => {
          let result = JSON.parse(text);
          this.$emit('addDataset', result);
          this.$refs['file-input'].reset();
        });
      }
    }
  },
  mounted() {
    this.init();
  }
};
</script>

<style scoped>
.settings-container {
  width: 100%;
  font-size: 1.2em;
  background-color: #2d2a2e;
  display: flex;
  flex-direction: row;
  border-top: 1px solid black;
  overflow-x: auto;
  flex-wrap: nowrap;
}

.help-container {
  font-size: 0.8em;
  font-style: italic;
}

.icon {
  margin-right: 10px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  padding: 10px 20px 25px 20px;
  margin: 0px 20px;
  flex: 0 0 400px;
  width: 400px;
  flex: 0 0 400px;
}

.settings-group:last-child {
  padding-right: 40px;
}

.settings-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 25%;
  width: 100%;
}

.settings-row button {
  margin-left: 20px;
}

.settings-row span {
  width: 400px;
  overflow-wrap: break-word;
}

.switches-right label {
  margin-left: auto;
}
</style>
