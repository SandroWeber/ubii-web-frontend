<template>
  <div>
    <div id="example-threejs-render-container" class="render-container"></div>
  </div>
</template>

<script>

import ModelViewerUbiiConnections from './model-viewer-ubii-connections';
import ModelViewerRendering from './model-viewer-rendering';

export default {
  name: 'ExampleTHREEjs',
  data() {
    return {};
  },
  methods: {
    init: function() {
      let container = document.getElementById(
        'example-threejs-render-container'
      );
      this.rendering = new ModelViewerRendering(container);
      this.rendering.init();

      let ubiiConnections = new ModelViewerUbiiConnections(this.rendering);
      ubiiConnections.init();
    },
    stop: function() {
      this.renderer = null;
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
.render-container {
  height: 100%;
}
</style>
