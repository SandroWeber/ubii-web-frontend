<template>
  <app-layer class="interaction-explorer layer-two background shadow">
    <app-explorer 
      :records="interactions"
    />
  </app-layer>
</template>

<script>
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
