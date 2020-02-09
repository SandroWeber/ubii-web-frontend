<template>
    <div id="graph-view">
        <div id="force-graph-container" class="render-container"></div>
        <div id="threejs-container" class="render-container">
            <div id="helper-container">
                <b-button class="mb-2" variant="primary" @click="$bvToast.show('controls-toast')">
                    <KeyboardIcon fillColor="#FF0000" />
                </b-button>
                <b-toast class="toaster-body" id="controls-toast" title="Controls" static>
                    <p><Numeric1BoxIcon /> <span class="text">to</span> <Numeric4BoxIcon />  <span class="text">: Set node to Level (-4) to (-1)</span></p>
                    <p><Numeric5BoxIcon /><span class="text">: Set node to Level 0</span></p>
                    <p><Numeric6BoxIcon /> <span class="text">to</span> <Numeric9BoxIcon />  <span class="text">: Set node to Level 1 to 4</span></p>
                    <p><AlphaWBoxIcon /> <AlphaABoxIcon /> <AlphaSBoxIcon /> <AlphaDBoxIcon /><span class="text">: Camera Pan Controls</span></p>
                    <p><AlphaRBoxIcon /><span class="text">: Reset Camera to Front/2D View</span></p>
                </b-toast>
            </div>
            <div id="node-label" class="tooltip-label"></div>
        </div>
    </div>
</template>

<script>
  import $ from 'jquery';
  import Vue from 'vue';
  import { ForceGraphVis } from './modules/visualization/3d-force-graph';
  import { setupThreejsEnvironment } from './modules/visualization/threejs-setup';

  import 'bootstrap/dist/css/bootstrap.css';
  import 'bootstrap-vue/dist/bootstrap-vue.css';
  import { BToast, BButton } from 'bootstrap-vue';

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
  import AlphaRBoxIcon from 'vue-material-design-icons/AlphaRBox.vue';

  export default {
    name: 'GraphView',
    props: {
      dataset: {
        type: Object,
        required: true
      },
      eventBus: {
        type: Object
      }
    },
    components: {
      'b-toast': BToast,
      'b-button': BButton,
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
      AlphaRBoxIcon,
    },
    data: () => {
      return {
        visualizations: {},
        view: 0,
      };
    },
    watch: {
      view: function(val) {
        if (val < 0 || val > 3) {
          return;
        }
        if(val == 0) {
          this.visualizations.forceGraph.resumeAnimation();
          $('#threejs-container').hide();
          $('#force-graph-container').show();
        }

        if(val == 1) {
          this.visualizations.forceGraph.pauseAnimation();
          $('#force-graph-container').hide();
          $('#threejs-container').show();
        }
      }
    },
    methods: {
      init: function() {
        this.eventBus.$on('view-change', (val) => {
          this.view = val;
        });

        this.visualizations.forceGraph = ForceGraphVis(document.getElementById('force-graph-container'))(this.$props.dataset);
        this.visualizations.threegraph = setupThreejsEnvironment(document.getElementById('threejs-container'), this.$props.dataset);
      },
    },
    mounted() {
      this.init();
    },
  };
</script>

<style scoped>
    .toaster-body {
        color: black;
    }

    .toaster-body >>> span.material-design-icon, .toaster-body >>> svg {
        width: 30px;
        height: 30px;
    }

    .toaster-body >>> span.text {
        display: inline-flex;
        align-self: center;
        position: relative;
        height: 30px;
        justify-content: center;
        align-items: center;
        top: -8px;
    }

    .mb-2 >>> svg, .mb-2 >>> span {
        width: 25px;
        height: 25px;
    }

    .toaster-body >>> p {
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

    #helper-container {
        position: absolute;
        top: 10px;
        left: 10px;
        display: inline-block;
        /*background-color: rgba(255,255,255,0.5);*/
        z-index: 2;
    }

    .tooltip-label {
        position: absolute;
        z-index: 3;
        color: white;
        font-size: 1.0rem;
    }
</style>