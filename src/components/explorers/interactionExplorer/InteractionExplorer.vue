<template>
  <app-layer class="interaction-explorer layer-two background shadow">
    <app-explorer
      :records="interactions"
      :categories="categories"
      :options="options"
      @add="addDefaultInteraction"
      @save="saveInteractions"
      @remove="removeInteractions"
      @refresh="pull"
      @select="onSelect"
    />
  </app-layer>
</template>

<script>
import { mapActions } from 'vuex';
import { AppLayer, AppExplorer } from './../../appComponents/appComponents.js';

export default {
  name: 'InteractionExplorer',
  components: {
    AppLayer,
    AppExplorer
  },
  props: {
    interactions: Array
  },
  data: function() {
    return {
      categories: [
        {
          title: 'Editable',
          filter: record => {
            return record.editable;
          }
        },
        {
          title: 'Non-Editable',
          filter: record => {
            return !record.editable;
          }
        }
      ],
      options: {
        sort: 'alphabetically',
        tools: {
          add: true,
          save: true,
          remove: true,
          refresh: true,
          filter: true
        },
        alwaysSelected: true
      }
    };
  },
  methods: {
    onSelect: function(payload) {
      this.$emit('select', payload);
    },
    removeInteractions: function(payload) {
      for (let i = 0; i < payload.records.length; i++) {
        this.deleteInteraction({
          interaction: payload.records[i]
        });
      }
    },
    ...mapActions('interactions', {
      addDefaultInteraction: 'addDefault',
      deleteInteraction: 'deleteInteraction',
      pull: 'pull'
    }),
    saveInteractions: function() {}
  }
};
</script>

<style scoped lang="stylus">
.interaction-explorer {
  height: 100%;
  min-width: 300px;
  width: 100%;
  overflow: hidden;
  flex-grow: 0;
  display: flex;
  flex-direction: column;
}
</style>
