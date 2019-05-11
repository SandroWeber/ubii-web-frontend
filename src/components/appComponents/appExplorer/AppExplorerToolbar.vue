<template>
  <div
    class="app-explorer-toolbar"
  >
    <app-button 
      v-if="options.tools.add"
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
      v-if="options.tools.remove"
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
      v-if="options.tools.refresh"
      :class="'tool-button round low-contrast'"
      @click="refresh()"
      :contentSizePercentage="65"
    >
      <font-awesome-icon 
      icon="sync-alt"
      class="tool-icon"
      />
    </app-button>

    <app-input 
      class="filter-input layer-one round low-contrast low-contrast-border"
      :class="filterInputClasses"
      v-model="filter"
      placeholder="filter"
      :id="'app-explorer-input'"
    >
    </app-input>
  </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faPlus);
  library.add(faTrashAlt);

  import AppButton from './../AppButton.vue';
  import AppInput from './../AppInput.vue';

  export default { 
    name: 'AppExplorerToolbar',
    components: {
      AppButton,
      AppInput
    },
    props: {
      selectedInteractionId: String,
      options: Object
    },
    data: function(){
      return {
        localFilter: ""
      }
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
    },
    computed: {
      filter: {
        get() {
          return this.localFilter;
        },
        set(value) {
          this.localFilter = value;
          this.$emit('filter', this.localFilter);
        }
      },
      filterInputClasses: function(){
        return{
          "yellow-border": this.localFilter !== "",
          "yellow-accent": this.localFilter !== ""
        }
      }
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

.filter-input
  flex-grow: 1
</style>
