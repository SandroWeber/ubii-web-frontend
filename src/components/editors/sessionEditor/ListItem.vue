<template>
  <div class="list-item" :class="{ selected: selected, normal: normal }" @click.exact="change">
    <font-awesome-icon icon="info-circle" class="icon" v-if="list_item == 1" />
    <font-awesome-icon icon="list-alt" class="icon" v-if="list_item == 2" />
    <slot></slot>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { faInfoCircle, faListAlt } from '@fortawesome/free-solid-svg-icons';
library.add(faInfoCircle, faListAlt);

export default {
  name: 'ListItem',
  props: {
    id: {
      required: true
    },
    selected: {
      type: Boolean,
      required: true
    },
    normal: {
      type: Boolean
    },
    list_item: {
      type: Number
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
.list-item {
  background-color: #2d2a2e;
  padding: 0.5em 1em 0.5em 1em;
  display: flex;
  align-items: center;
  height: 50px;
}

.normal:hover {
  background-color: #403e41;
  cursor: pointer;
}

.icon {
  margin-right: 0.5em;
}

.selected {
  color: #ddd866;
}
</style>