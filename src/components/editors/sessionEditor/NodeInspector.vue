<template>
  <div class="NodeInspector">
    <div class="data-item">
      <span class="label">Node:</span>&nbsp;
      <span v-if="settings.viewNode <= -1">No Node selected</span>
      <span v-else>{{ node.name }}</span>
    </div>
    <div v-if="settings.viewNode >= 0" class="data-list">
      <div class="data-item">
        <span class="label">Tags:</span>&nbsp;
        <span v-if="node.tags.length == 0">No Tags</span>
        <span v-else>
          {{ node.tags.join(', ') }}
        </span>
      </div>
      <div class="data-item">
        <span class="label">Links:</span>
        <span v-if="node.links.length == 0"> No Links</span>
        <span v-else>
          <div v-for="link in node.links" :key="link">
            <a target="_blank" :href="link">{{ link }}</a>
          </div>
        </span>
      </div>
      <div v-if="node.data">
        <div v-for="(value, name) in node.data" :key="name">
          <span class="label">{{ name }}:</span>&nbsp;
          {{ value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faInfoCircle, faListAlt } from '@fortawesome/free-solid-svg-icons';
library.add(faInfoCircle, faListAlt);

export default {
  name: 'NodeInspector',
  props: {
    settings: {
      type: Object
    },
    dataset: {
      type: Object
    }
  },
  computed: {
    node: function() {
      return this.dataset.nodes.find(el => el.id == this.settings.viewNode);
    }
  },
  methods: {
    change: function() {
      this.$emit('change', 'dataset', this.id);
    }
  }
};
</script>

<style scoped>
.NodeInspector {
  padding: 20px;
  font-size: 1em;
}

.data-item {
  margin: 0px 0px 20px 0;
  word-wrap: break-word;
}

.data-item a {
  font-size: 0.9em;
}

.data-item:last-child {
  margin: 0;
}

.data-list > :last-child {
  margin: 0px;
}

.label {
  text-decoration: underline;
}
</style>
