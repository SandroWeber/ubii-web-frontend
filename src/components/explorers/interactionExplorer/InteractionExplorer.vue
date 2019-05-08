<template>
  <app-layer class="interaction-explorer layer-two background shadow">
    <app-explorer 
      :records="interactions"
      @add="addDefaultInteraction"
      @refresh="pull"
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
      onSelectItem: function(id){
        this.$emit('selectInteraction', id)
      },
      deleteInteraction: function(){
        this.$emit('delete')

        this.deleteInteractionAtStore({
          currentInteractionId: this.selectedInteractionId,
        });
      },
      ...mapActions('interactions', {
        addInteraction: 'add',
        addDefaultInteraction: 'addDefault',
        deleteInteractionAtStore: 'deleteInteraction',
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
