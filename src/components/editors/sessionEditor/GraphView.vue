<template>
  <div id="graph-view" v-if="datasets.length > 0">
    <div id="force-graph-container" class="render-container"></div>
    <div id="threejs-container" class="render-container">
      <div class="ui-container top" v-if="visualizations.threegraph != null">
        <div class="row">
          <span
            v-for="tag in structure"
            v-bind:key="tag.id"
            v-bind:id="tag.id.replace(/ |\|/g, '')"
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
                  visualizations.threegraph.scene.focusOnLayer(tag.id);
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
            static
          >
            <p>
              <Numeric1BoxIcon />
              <span class="text">to</span>
              <Numeric4BoxIcon />
              <span class="text">: Set node to Level 1 to 4</span>
            </p>
            <p>
              <Numeric5BoxIcon />
              <span class="text">: Set node to Level 5</span>
            </p>
            <p>
              <Numeric6BoxIcon />
              <span class="text">to</span>
              <Numeric9BoxIcon />
              <span class="text">: Set node to Level 6 to 9</span>
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
              <span class="text"
                >: Reset Camera to Main View (X-Axis/2D/Front)</span
              >
            </p>
            <p>
              <AlphaYBoxIcon />
              <span class="text"
                >: Reset Camera to Level View (Y-Axis/2D/Side)</span
              >
            </p>
          </b-toast>
        </div>
        <div class="row">
          <b-button
            id="controls-btn"
            class="ui-item"
            variant="primary"
            @click="$bvToast.show('controls-toast')"
          >
            <KeyboardIcon fillColor="#FF0000" />
          </b-button>
          <b-button id="view-badge" class="ui-item" variant="primary"
            >View: X-Axis (Main)</b-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery';
import { ForceGraphVis } from './modules/visualization/3d-force-graph';
import { setupThreejsEnvironment } from './modules/visualization/threejs-setup';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import { BToast, BButton, BBadge } from 'bootstrap-vue';

import 'vue-material-design-icons/styles.css';
import KeyboardIcon from 'vue-material-design-icons/Keyboard.vue';
import Numeric1BoxIcon from 'vue-material-design-icons/Numeric1Box.vue';
import Numeric4BoxIcon from 'vue-material-design-icons/Numeric4Box.vue';
import Numeric5BoxIcon from 'vue-material-design-icons/Numeric5Box.vue';
import Numeric6BoxIcon from 'vue-material-design-icons/Numeric6Box.vue';
import Numeric9BoxIcon from 'vue-material-design-icons/Numeric9Box.vue';
import AlphaWBoxIcon from 'vue-material-design-icons/AlphaWBox.vue';
import AlphaABoxIcon from 'vue-material-design-icons/AlphaABox.vue';
import AlphaSBoxIcon from 'vue-material-design-icons/AlphaSBox.vue';
import AlphaDBoxIcon from 'vue-material-design-icons/AlphaDBox.vue';
import AlphaXBoxIcon from 'vue-material-design-icons/AlphaXBox.vue';
import AlphaYBoxIcon from 'vue-material-design-icons/AlphaYBox.vue';
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
    'b-toast': BToast,
    'b-button': BButton,
    'b-badge': BBadge,
    KeyboardIcon,
    Numeric1BoxIcon,
    Numeric4BoxIcon,
    Numeric5BoxIcon,
    Numeric6BoxIcon,
    Numeric9BoxIcon,
    AlphaWBoxIcon,
    AlphaABoxIcon,
    AlphaSBoxIcon,
    AlphaDBoxIcon,
    AlphaXBoxIcon,
    AlphaYBoxIcon,
    VideoIcon
  },
  data: () => {
    return {
      visualizations: {},
      view: 0,
      structure: ''
    };
  },
  computed: {
    dataset: function() {
      return this.datasets.find(ds => ds.id == this.settings.dataset);
    }
  },
  watch: {
    datasets: function() {
      this.rebootVisualizer();
      this.changeView(this.settings.view);
    },
    'settings.view': function(view) {
      this.rebootVisualizer();
      this.changeView(view);
    },
    'settings.mode': function(mode) {
      this.rebootVisualizer();
      this.setUpThreeJS();
    },
    'settings.dataset': function() {
      this.rebootVisualizer();
      this.changeView(this.settings.view);
    },
    'dataset.links': function() {
      console.log('a');
    },
    'settings.viewZeroMarker': function(show) {
      this.changeZeroMarker();
    },
    'settings.startNode': function(node) {
      this.rebootVisualizer();
      this.setUpThreeJS();
    },
    'settings.sorting': function(sorting) {
      this.rebootVisualizer();
      this.setUpThreeJS();
    },
    'settings.viewNode': function(viewNode) {
      if (viewNode >= 0) {
        this.visualizations.threegraph.scene.select(
          this.visualizations.threegraph.scene.meshes.find(
            el => el.userData.id == viewNode
          )
        );
      }
    },
    'settings.showAll': function(showAll) {
      this.visualizations.threegraph.scene.setShowAll(showAll);
    },
    'settings.slimLayers': function(slimLayers) {
      this.visualizations.threegraph.scene.setSlimLayers(slimLayers);
    },
    'settings.snapToGrid': function(snapToGrid) {
      this.visualizations.threegraph.scene.setSnapToGrid(snapToGrid);
    }
  },
  methods: {
    init: function() {
      this.changeView(this.settings.view);
      this.$forceUpdate();
    },
    rebootVisualizer() {
      if (this.visualizations.forceGraph != null) {
        this.visualizations.forceGraph.pauseAnimation();
        this.visualizations.forceGraph = null;
        $('#force-graph-container div:first-child').remove();
      }
      if (this.visualizations.threegraph != null) {
        this.visualizations.threegraph.cancelVisualization();
        this.visualizations.threegraph = null;
      }
    },
    setUpThreeJS() {
      this.visualizations.threegraph = setupThreejsEnvironment(
        document.getElementById('threejs-container'),
        this.dataset,
        this.settings,
        this.change
      );
      this.changeZeroMarker();
      this.structure = this.visualizations.threegraph.scene.structure;
    },
    changeView: function(view) {
      if (view < 0 || view > 6) {
        return;
      }

      if (view == 0) {
        $('#threejs-container').hide();
        $('#force-graph-container').show();
        if (this.visualizations.forceGraph == null) {
          this.visualizations.forceGraph = ForceGraphVis(
            document.getElementById('force-graph-container')
          )(JSON.parse(JSON.stringify(this.dataset)));
        } else {
          this.visualizations.forceGraph.resumeAnimation();
        }
      }

      if (view >= 1) {
        $('#force-graph-container').hide();
        $('#threejs-container').show();
        if (
          this.visualizations.threegraph == null ||
          this.visualizations.threegraph.mode != this.settings.mode
        ) {
          this.setUpThreeJS();
        } else if (this.visualizations.forceGraph != null) {
          this.visualizations.forceGraph.pauseAnimation();
        }
      }
    },
    changeZeroMarker() {
      if (this.visualizations.threegraph != undefined) {
        this.settings.viewZeroMarker
          ? this.visualizations.threegraph.scene.showZeroMarker()
          : this.visualizations.threegraph.scene.hideZeroMarker();
      }
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
  height: 100%;
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.render-container {
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
  bottom: 10px;
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
  padding: 0 5px 0 5px;
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
</style>
