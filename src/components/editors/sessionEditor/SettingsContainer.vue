<template>
  <div class="settings-container">
    <div class="settings-group">
      <div class="settings-row">Import:</div>
      <div class="settings-row">
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
      <div class="settings-row">Graph:</div>
      <div class="settings-row">
        <b-form-select
          v-model="selectedGraphType"
          :options="graphTypeOptions"
          @input="changeGraphType"
        ></b-form-select>
      </div>
    </div>
    <div class="settings-group">
      <div
        class="settings-row"
        v-if="
          selectedGraphType != '2D-FORCE' && selectedGraphType != '3D-FORCE'
        "
      >Mode:</div>
      <div
        class="settings-row"
        v-if="
          selectedGraphType != '2D-FORCE' && selectedGraphType != '3D-FORCE'
        "
      >
        <b-form-select
          v-model="selectedSceneId"
          :options="sceneIdFilteredOptions"
          @input="changeSceneId"
        ></b-form-select>
      </div>
      <div class="settings-row">Explanation:</div>
      <div class="settings-row">
        <div class="help-container">
          <font-awesome-icon icon="question-circle" class="icon" />
          <span v-if="selectedGraphType == '2D-FORCE'">A two-dimensional force directed graph.</span>
          <span v-if="selectedGraphType == '3D-FORCE'">A three-dimensional force directed graph.</span>
          <span
            v-if="
              selectedGraphType == 'LAYERED' && selectedSceneId == 'EXPLORATION'
            "
          >
            Explore the graph freely with 9 individually usable layers. These
            layers can be filled however you want.
          </span>
          <span v-if="selectedGraphType == 'LAYERED' && selectedSceneId == 'TAGS'">
            Sort your Nodes in layers depending on which tags (or combination of
            tags) they reference.
          </span>
          <span v-if="selectedGraphType == 'LAYERED' && selectedSceneId == 'DEGREE'">
            Sort your Nodes in layers depending on how many edges flow into a
            node / out of a node (node degree).
          </span>
          <span v-if="selectedGraphType == 'LAYERED' && selectedSceneId == 'STEPS'">
            Sort your Nodes in layers depending on how many steps they are away
            from your Starting Node
          </span>
          <span v-if="selectedGraphType == 'GROUPED' && selectedSceneId == 'MANUAL'">
            Structure the graph by merging nodes together to form groups. Open
            or close groups to reveal the individual nodes inside.
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="selectedGraphType == 'LAYERED' || selectedGraphType == 'GROUPED'"
      class="settings-group switches-right"
    >
      <div class="settings-row" v-if="selectedGraphType == 'LAYERED'">
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
      <div class="settings-row" v-if="selectedGraphType == 'LAYERED'">
        Slim Layers:
        <toggle-button
          id="layer-slim-toggle"
          :height="28"
          :width="90"
          :color="{ unchecked: '#406184', checked: '#388DE8' }"
          :font-size="15"
          :value="selectedSlimLayers"
          :labels="{ checked: 'Slim', unchecked: 'Wide' }"
          @change="changeSlimLayers"
        ></toggle-button>
      </div>
      <div class="settings-row" v-if="selectedGraphType == 'LAYERED'">
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
      v-if="
        selectedGraphType == 'LAYERED' &&
          (selectedSceneId == 'DEGREE' || selectedSceneId == 'STEPS')
      "
      class="settings-group"
    >
      <div class="settings-row">
        <span v-if="selectedSceneId == 'DEGREE'">Sorting:</span>
        <span v-if="selectedSceneId == 'STEPS'">Starting Node:</span>
      </div>
      <div class="settings-row">
        <b-form-select
          v-if="selectedSceneId == 'DEGREE'"
          v-model="selectedSorting"
          :options="sortingOptions"
          @input="changeSorting"
        ></b-form-select>
        <b-form-select
          v-if="selectedSceneId == 'STEPS'"
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
import { BFormSelect, BButton, BFormFile } from 'bootstrap-vue';

import { ToggleButton } from 'vue-js-toggle-button';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
library.add(faQuestionCircle);

export default {
  name: 'SettingsContainer',
  components: {
    'b-form-select': BFormSelect,
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
      selectedGraphType: this.settings.graphType,
      selectedSceneId: this.settings.sceneId,
      selectedSorting: this.settings.sorting,
      selectedStartNode: this.settings.startNode,
      selectedSlimLayers: this.settings.slimLayers,
      selectedShowAll: this.settings.showAll,
      selectedZeroMarker: this.settings.viewZeroMarker,
      selectedSnapToGrid: this.settings.snapToGrid,
      graphTypeOptions: [
        { value: '2D-FORCE', text: '2D Force-Graph' },
        { value: '3D-FORCE', text: '3D Force-Graph' },
        { value: 'LAYERED', text: 'Layered Graph' },
        { value: 'GROUPED', text: 'Grouped Graph' }
      ],
      sceneIdOptions: [
        { value: 'EXPLORATION', text: 'Exploration', graphType: 'LAYERED' },
        { value: 'TAGS', text: 'Layers by Tags', graphType: 'LAYERED' },
        {
          value: 'DEGREE',
          text: 'Layers by Node Degree',
          graphType: 'LAYERED'
        },
        { value: 'STEPS', text: 'Layers by Steps', graphType: 'LAYERED' },
        { value: 'MANUAL', text: 'Manual Grouping', graphType: 'GROUPED' }
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
  computed: {
    sceneIdFilteredOptions: function() {
      return this.sceneIdOptions.filter(
        el => el.graphType == this.selectedGraphType
      );
    }
  },
  watch: {
    dataset: function(ds) {
      this.startNodeOptions = [];
      ds.nodes.forEach(node =>
        this.startNodeOptions.push({ value: node.id, text: node.name })
      );
    },
    'settings.sceneId': function(value) {
      this.selectedSceneId = value;
    }
  },
  methods: {
    init: function() {
      this.dataset.nodes.forEach(node =>
        this.startNodeOptions.push({ value: node.id, text: node.name })
      );
    },
    changeGraphType: function(value) {
      if (value != '2D-FORCE' && value != '3D-FORCE') {
        //Reset sceneId by publishing first one of graphType when graphType changes
        let sceneId = this.sceneIdOptions.filter(el => el.graphType == value)[0]
          .value;
        this.$emit('change', 'sceneId', sceneId);
      }
      this.$emit('change', 'graphType', value);
    },
    changeSceneId: function(value) {
      this.$emit('change', 'sceneId', value);
    },
    changeSorting: function(value) {
      this.$emit('change', 'sorting', value);
    },
    changeZeroMarker: function(value) {
      this.$emit('change', 'viewZeroMarker', value.value);
    },
    changeStartNode: function(value) {
      this.$emit('change', 'startNode', value);
    },
    changeSlimLayers: function(value) {
      this.$emit('change', 'slimLayers', value.value);
    },
    changeShowAll: function(value) {
      this.$emit('change', 'showAll', value.value);
    },
    changeSnapToGrid: function(value) {
      this.$emit('change', 'snapToGrid', value.value);
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
