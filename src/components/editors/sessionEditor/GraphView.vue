<template>
  <div id="graph-view" v-if="datasets.length > 0">
    <div id="force-graph-container-2d" class="render-container"></div>
    <div id="force-graph-container-3d" class="render-container"></div>
    <div id="threejs-container" class="render-container">
      <div id="threejs-ui-container-top" class="ui-container top">
        <div class="row">
          <span
            v-for="tag in structure"
            v-bind:key="tag.id"
            v-bind:id="tag.id.replace(/ |\||\(|\)/g, '')"
            v-bind:style="
              'background-color:' +
                (tag.color == '#ffffff' ? '#b6b5b5' : tag.color)
            "
            class="ui-box ui-item"
          >
            {{ tag.id }}
            <b-badge variant="light">{{ tag.content.length }}</b-badge>
            <span
              @click="
                () => {
                  visManager.layeredGroupedGraphVis.scene.focusOn(tag.id);
                }
              "
              class="focus-icon"
            >
              <VideoIcon></VideoIcon>
            </span>
          </span>
        </div>
      </div>
      <div id="node-label" class="tooltip-label"></div>
      <div class="ui-container bottom">
        <div class="row" style="margin-bottom: 10px">
          <b-toast
            class="toast-item"
            id="controls-toast"
            title="Controls"
            auto-hide-delay="3000"
            static
          >
            <p
              v-if="
                settings.graphType == 'LAYERED' &&
                  settings.sceneId == 'EXPLORATION'
              "
            >
              <Numeric1BoxIcon />
              <span class="text">to</span>
              <Numeric9BoxIcon />
              <span class="text">: Set node to Layer 1 to 9</span>
            </p>
            <p
              v-if="
                settings.graphType == 'GROUPED' && settings.sceneId == 'MANUAL'
              "
            >
              <AlphaMBoxIcon />
              <span class="text">: Merge selected nodes together</span>
            </p>
            <p
              v-if="
                settings.graphType == 'GROUPED' && settings.sceneId == 'MANUAL'
              "
            >
              <AlphaRBoxIcon />
              <span class="text">: Remove the selected group while dragging its node</span>
            </p>
            <p>
              <AlphaWBoxIcon />
              <AlphaABoxIcon />
              <AlphaSBoxIcon />
              <AlphaDBoxIcon />
              <span class="text">: Camera Pan Controls</span>
            </p>
            <p>
              <AlphaXBoxIcon />
              <span class="text">: Reset Camera to Main View (X-Axis/2D/Front)</span>
            </p>
            <p>
              <AlphaYBoxIcon />
              <span class="text">: Reset Camera to Layer View (Y-Axis/2D/Side)</span>
            </p>
          </b-toast>
        </div>
        <div class="row">
          <span @click="$bvToast.show('controls-toast')" class="ui-box ui-item">
            <span class="focus-icon">
              <KeyboardIcon fillColor="#FF0000" />
            </span>
          </span>
          <span id="view-badge" class="ui-box ui-item">View: X-Axis (Front)</span>
        </div>
      </div>
      <div id="warning">
        This graph contains cycles!
        <br />But in order to show the number of steps from a starting node to all
        other nodes an acyclic graph is required.
        <br />Please consider using another Mode or Graph Type.
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery';
import { VisualizationManager } from './modules/visualization/visualization-manager';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import { BBadge } from 'bootstrap-vue';

import 'vue-material-design-icons/styles.css';
import KeyboardIcon from 'vue-material-design-icons/Keyboard.vue';
import Numeric1BoxIcon from 'vue-material-design-icons/Numeric1Box.vue';
import Numeric9BoxIcon from 'vue-material-design-icons/Numeric9Box.vue';
import AlphaWBoxIcon from 'vue-material-design-icons/AlphaWBox.vue';
import AlphaABoxIcon from 'vue-material-design-icons/AlphaABox.vue';
import AlphaSBoxIcon from 'vue-material-design-icons/AlphaSBox.vue';
import AlphaDBoxIcon from 'vue-material-design-icons/AlphaDBox.vue';
import AlphaXBoxIcon from 'vue-material-design-icons/AlphaXBox.vue';
import AlphaYBoxIcon from 'vue-material-design-icons/AlphaYBox.vue';
import AlphaMBoxIcon from 'vue-material-design-icons/AlphaMBox.vue';
import AlphaRBoxIcon from 'vue-material-design-icons/AlphaRBox.vue';
import VideoIcon from 'vue-material-design-icons/Video.vue';

export default {
  name: 'GraphView',
  props: {
    settings: {
      type: Object
    },
    datasets: {
      type: Array
    }
  },
  components: {
    'b-badge': BBadge,
    KeyboardIcon,
    Numeric1BoxIcon,
    Numeric9BoxIcon,
    AlphaWBoxIcon,
    AlphaABoxIcon,
    AlphaSBoxIcon,
    AlphaDBoxIcon,
    AlphaXBoxIcon,
    AlphaYBoxIcon,
    AlphaMBoxIcon,
    AlphaRBoxIcon,
    VideoIcon
  },
  data: () => {
    return {
      visManager: null,
      view: 0
    };
  },
  computed: {
    dataset: function() {
      return this.datasets.find(ds => ds.id == this.settings.dataset);
    },
    structure: function() {
      //The internal structure of the graph (either layers or groups or what ever else come to mind)
      if (
        this.visManager &&
        this.visManager.layeredGroupedGraphVis &&
        this.visManager.layeredGroupedGraphVis.scene
      ) {
        return this.visManager.layeredGroupedGraphVis.scene.structure;
      } else {
        return [];
      }
    }
  },
  watch: {
    'settings.graphType': function() {
      this.visManager.showScene();
    },
    'settings.sceneId': function() {
      this.visManager.showScene();
    },
    'settings.dataset': function() {
      this.visManager.changeSetting('dataset', this.dataset);
    },
    'settings.viewZeroMarker': function() {
      this.visManager.changeSetting('viewZeroMarker');
    },
    'settings.startNode': function() {
      this.visManager.changeSetting('startNode');
    },
    'settings.sorting': function() {
      this.visManager.changeSetting('sorting');
    },
    'settings.viewNode': function(value) {
      this.visManager.changeSetting('viewNode', value);
    },
    'settings.showAll': function() {
      this.visManager.changeSetting('showAll');
    },
    'settings.slimLayers': function() {
      this.visManager.changeSetting('slimLayers');
    },
    'settings.snapToGrid': function() {
      this.visManager.changeSetting('snapToGrid');
    }
  },
  methods: {
    init: function() {
      this.visManager = new VisualizationManager(
        this.dataset,
        this.settings,
        this.change,
        $('#threejs-container'),
        $('#force-graph-container-2d'),
        $('#force-graph-container-3d')
      );
      this.visManager.showScene(this.settings);
      //this.visManager.animate();
      this.visManager.layeredGroupedGraphVis.resizeRenderer();
      this.$forceUpdate();
    },
    change: function(setting, value) {
      this.$emit('change', setting, value);
    }
  },
  mounted() {
    this.init();
  }
};
</script>

<style scoped>
.toast-item {
  color: black;
}

.toast-item >>> span.material-design-icon,
.toast-item >>> svg {
  width: 30px;
  height: 30px;
}

.toast-item >>> span.text {
  display: inline-flex;
  align-self: center;
  position: relative;
  height: 30px;
  justify-content: center;
  align-items: center;
  top: -8px;
}

.ui-item >>> svg {
  width: 25px;
  height: 25px;
}

.toast-item >>> p {
  margin: 0;
}

#graph-view {
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.render-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.ui-container {
  position: absolute;
  left: 25px;
  display: flex;
  flex-direction: column;
  z-index: 2;
  width: 100%;
}

.row {
  display: flex;
  flex-direction: row;
}

.top {
  top: 10px;
}

.bottom {
  bottom: 40px;
}

.ui-item {
  min-height: 50px;
  margin-right: 20px;
}

.ui-box {
  display: flex;
  min-width: 100px;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  border: 1px solid #000000;
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 0 9px 0 9px;
  background-color: #2d2a2e;
}

.ui-box >>> .badge {
  margin: 0 0 0 10px;
  font-size: 1em;
}

#controls-btn {
  padding: 2px 0.75em;
}

.tooltip-label {
  position: absolute;
  z-index: 3;
  color: black;
  font-size: 1rem;
  background-color: #b5b5b5;
  border: 1px solid white;
  border-radius: 4px;
  padding: 5px;
  display: none;
}

.focus-icon {
  border: 2px solid black;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px 5px 5px 10px;
  padding: 5px 10px;
  overflow: hidden;
  position: relative;
}

.focus-icon >>> svg {
  top: -2px;
  left: -4px;
}

.disabled {
  background-color: #b2b0b0 !important;
}

.enabled {
  border-color: white;
}

#warning {
  padding: 20px;
  border: 2px solid red;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 30%;
  width: 40%;
  background-color: black;
  font-size: 1.2em;
  display: none;
  text-align: center;
}

#threejs-container >>> .toast,
#threejs-container >>> .b-toast {
  max-width: 500px !important;
}
</style>
