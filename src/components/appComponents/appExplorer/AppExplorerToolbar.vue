<template>
  <div
    class="app-explorer-toolbar"
  >
    <app-button 
      :class="'tool-button round low-contrast'"
      @click="add()"
      :contentSizePercentage="70"
    >
      <font-awesome-icon 
      icon="plus"
      class="tool-icon"
      />
    </app-button>

    <app-button 
      :class="'tool-button round low-contrast'"
      @click="remove()"
      :contentSizePercentage="60"
    >
      <font-awesome-icon 
      icon="trash-alt"
      class="tool-icon"
      />
    </app-button>

    <app-button 
      :class="'tool-button round low-contrast'"
      @click="refresh()"
      :contentSizePercentage="65"
    >
      <font-awesome-icon 
      icon="sync-alt"
      class="tool-icon"
      />
    </app-button>
  </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faPlus);
  library.add(faTrashAlt);

  import AppButton from './../AppButton.vue';

  export default { 
    name: 'AppExplorerToolbar',
    components: {
      AppButton
    },
    props: {
      selectedInteractionId: String,
      options: Object
    },
    methods: {
      add: function(){
        this.$emit('add');
      },
      remove: function(){
        this.$emit('remove');
      },
      refresh: function(){
        this.$emit('refresh');
      },
    }
  } 
</script> 

<style scoped lang="stylus"> 
.app-explorer-toolbar
  display flex
  flex-direction row
  padding 0.5em

.tool-button 
  height: 1.8em
  width: 1.8em
  margin-right: 0.5em

.tool-icon
  height: 100%
  width: 100%
</style>
