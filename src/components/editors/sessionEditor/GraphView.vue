<template>
    <div id="graph-view">
        <div id="example-threejs-render-container" class="render-container"></div>
    </div>
</template>

<script>
  import * as THREE from 'three';
  import $ from 'jquery';
  import ForceGraph3D from '3d-force-graph';

  const OrbitControls = require('three-orbit-controls')(THREE);

  export default {
    name: 'GraphView',
    props: {
      session: {
        type: Object,
        required: true
      }
    },
    data: () => {
      return {
        camera: null,
        scene: null,
        renderer: null,
        mesh: [],
        controls: null,
        graph: null
      };
    },
    watch: {
      session: function(newVal, oldVal) {
        this.reinit(newVal);
      }
    },
    methods: {
      init: function() {
        this.graph = ForceGraph3D({ width: 500 });
        this.graph(document.getElementById('example-threejs-render-container'));
        this.graph.d3Force('charge').strength(-150);
        this.graph.nodeColor(node => (node.id == 'id1' || node.id == 'id2') ? 'red' : 'blue');
        this.graph.backgroundColor('#19181A');
        $(window).resize(this.resize);
        this.resize();
        this.reinit(this.$props.session);
      },
      reinit: function(newVal) {
        this.graph.graphData({
          'nodes': [{ id: 'id1', name: 'Input - Start', val: 0},
            { id: 'id2', name: 'Output End', val: 0}],
          'links': [{ source: 'id1', target: 'id2' }]
        });
        if (newVal.interactions.length > 0) {
          this.addNodes(newVal.interactions);
        }
      },
      resize: function() {
        let width = parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
        let height = parseInt($('#side-bar').css('height'));
        this.graph.width(width).height(height).refresh();
      },
      animate: function() {

      },
      stop: function() {

      },
      addNodes: function(interactions) {
        const { nodes, links } = this.graph.graphData();
        let newNodes = [], newLinks = [];
        interactions.forEach(((interaction) => {
          newNodes.push({ id: interaction.id, name: interaction.name, val: 0 });
        }));
        newNodes.forEach((interaction, index) => {
          if (index < newNodes.length - 1) {
            newLinks.push({ source: interaction.id, target: newNodes[index + 1].id });
          }
        });
        newLinks.push({ source: 'id1', target: newNodes[0].id }, {
          source: newNodes[newNodes.length - 1].id,
          target: 'id2'
        });
        this.graph.graphData({ nodes: [...nodes, ...newNodes], links: newLinks });
      }
    },
    mounted() {
      window.addEventListener('beforeunload', () => {
        this.stop();
      });

      this.init();
    },
    beforeDestroy: function() {
      this.stop();
    }
  };
</script>

<style scoped>
    #graph-view {
        height: 100%;
        overflow: hidden;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    .render-container {
        height: 100%;
    }
</style>