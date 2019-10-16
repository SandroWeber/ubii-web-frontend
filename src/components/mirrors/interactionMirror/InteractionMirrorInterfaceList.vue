<template>
  <div class="interaction-mirror-interface-list">
    <div class="toolbar">
      <h3>{{interfaceKey}}</h3>

      <app-button
        :class="'tool-button add-interface-entry-button round low-contrast'"
        @click="addInterfaceEntry"
        :contentSizePercentage="60"
      >
        <font-awesome-icon icon="plus" class="tool-icon" />
      </app-button>
    </div>

    <div class="token-container">
      <interaction-mirror-interface-list-token
        v-for="(element, index) in localValue"
        :key="index"
        :index="index"
        v-model="localValue[index]"
        @input="fireInputEvent"
        :interface-key="interfaceKey"
        :code="code"
        @removeInterfaceEntry="removeInterfaceEntry"
      />
    </div>
  </div>
</template>

<script>
import InteractionMirrorInterfaceListToken from './InteractionMirrorInterfaceListToken.vue';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlus,
  faPencilAlt,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
library.add(faPlus);
library.add(faPencilAlt);
library.add(faTrash);

import { AppButton } from './../../appComponents/appComponents.js';

export default {
  name: 'interactionInterfaceList',
  components: {
    InteractionMirrorInterfaceListToken: InteractionMirrorInterfaceListToken,
    AppButton: AppButton
  },
  props: {
    value: Array,
    interfaceKey: String,
    code: String
  },
  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(localValue) {
        this.$emit('input', localValue);
      }
    }
  },
  methods: {
    addInterfaceEntry: function() {
      let raw = this.localValue;
      raw.push({
        internalName: 'defaultInterface',
        messageFormat: 'messageFormat'
      });
      this.localValue = raw;
    },
    removeInterfaceEntry: function(index) {
      let raw = this.localValue;
      raw.splice(index, 1);
      this.localValue = raw;
    },
    fireInputEvent: function() {
      this.$emit('input', this.localValue);
    }
  }
};
</script> 

<style scoped lang="stylus">.interaction-mirror-interface-list {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
}

.toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;

  &.expand {
    height: 100%;
  }
}

.token-container {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-wrap: wrap;
}

.toolbar-whitespace {
  flex-grow: 2;
  min-width: 1px;
}

.tool-button {
  width: 27px;
  height: 27px;
  order: 1;
  margin: 5px;
}

.tool-icon {
  width: 100%;
  height: 100%;
}
</style>
