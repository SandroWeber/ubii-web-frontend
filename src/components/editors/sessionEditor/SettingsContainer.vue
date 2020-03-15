<template>
  <div class="settings-container">
    <b-form-group label="Import:" labe-for="file" label-cols-sm="3">
      <b-form-file
        size="sm"
        v-model="file"
        placeholder="Choose .json file"
        drop-placeholder="Drop .json file here..."
        accept=".json"
        ref="file-input"
        id="file"
      ></b-form-file>
    </b-form-group>
    <div v-bind:style="'display: flex; justify-content: flex-end;'">
      <b-button @click="upload" variant="outline-primary">Import</b-button>
    </div>
    <b-form-group label="Graph:">
      <b-form-select
        v-model="selectedView"
        :options="viewOptions"
        @input="changeView"
      ></b-form-select>
    </b-form-group>
    <div v-if="selectedView == 1">
      <b-form-group label="Mode:">
        <b-form-select
          v-model="selectedMode"
          :options="modeOptions"
          @input="changeMode"
        ></b-form-select>
      </b-form-group>
      <div class="help-container" v-if="selectedView == 1">
        <font-awesome-icon icon="question-circle" class="icon" />
        <span v-if="selectedMode == 0"
          >Browse the graph with 9 individually usable Layers.</span
        >
        <span v-if="selectedMode == 1">
          Sort your Nodes in Layers depending on how which tags (or combination
          of tags) they reference.
        </span>
        <span v-if="selectedMode == 2">
          Sort your Nodes in Layers depending on how many edges flow into a node
          / out of a node.
        </span>
        <span v-if="selectedMode == 3">
          Sort your Nodes in Layers depending on how many steps they are away
          from your Starting Node
        </span>
      </div>
      <div v-if="selectedMode == 2">
        <b-form-group label="Sorting:">
          <b-form-select
            v-model="selectedSorting"
            :options="sortingOptions"
            @input="changeSorting"
          ></b-form-select>
        </b-form-group>
      </div>
      <div v-if="selectedMode == 3">
        <b-form-group label="Starting Node:">
          <b-form-select
            v-model="selectedStartNode"
            :options="startNodeOptions"
            @input="changeStartNode"
          ></b-form-select>
        </b-form-group>
      </div>
      <b-form-group
        label="Always show layers:"
        labe-for="layer-show-all-toggle"
        label-cols-sm="7"
      >
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
      </b-form-group>
      <b-form-group
        label="Slim Layers:"
        labe-for="layer-slim-toggle"
        label-cols-sm="7"
      >
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
      </b-form-group>
      <b-form-group
        label="Snap to Grid:"
        labe-for="layer-grid-snap-toggle"
        label-cols-sm="7"
      >
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
      </b-form-group>
      <b-form-group
        label="Zero-Marker:"
        labe-for="marker-toggle"
        label-cols-sm="7"
      >
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
      </b-form-group>
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
        { value: 0, text: 'Force-Graph' },
        { value: 1, text: 'Layered Graph' },
        { value: 2, text: 'Grouped Graph' }
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
  watch: {},
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
  padding: 20px;
  font-size: 1.2em;
}

.help-container {
  font-size: 0.8em;
  font-style: italic;
  margin-bottom: 15px;
}

.icon {
  margin-right: 10px;
}
</style>
