<template>
  <app-layer class="interaction-explorer layer-two background shadow">
    <app-explorer 
      :records="interactions"
      @add="addDefaultInteraction"
      @remove="removeInteractions"
      @refresh="pull"
      @select="onSelect"
    />
  </app-layer>
</template>

<script>
  import { mapActions } from 'vuex'
  import { AppLayer, AppExplorer } from './../../appComponents/appComponents.js';

  export default {
    name: 'InteractionExplorer',
    props: {
      interactions: Array,
      selectedInteractionId: String
    },
    components: {
      AppLayer,
      AppExplorer,
    },
    methods: {
      onSelect: function(payload){
        this.$emit('select', payload)
      },
      removeInteractions: function(payload){
        for (let i = 0; i < payload.records.length; i++) {
          this.deleteInteraction({
            interaction: payload.records[i],
          });
        }
      },
      ...mapActions('interactions', {
        addInteraction: 'add',
        addDefaultInteraction: 'addDefault',
        deleteInteraction: 'deleteInteraction',
        pull: 'pull',
      }),
    },
  }
</script>

<style scoped lang="stylus">
.interaction-explorer
  height: 100%
  min-width 300px
  width: 100%
  overflow: hidden
  flex-grow: 0
  display flex
  flex-direction column
</style>
