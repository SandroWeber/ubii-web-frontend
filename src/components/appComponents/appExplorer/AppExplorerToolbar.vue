<template>
  <div
    class="app-explorer-toolbar"
  >
    <app-button 
      v-if="options.tools.add"
      :class="'tool-button round low-contrast'"
      :contentSizePercentage="70"
      @click="add()"
    >
      <font-awesome-icon 
      icon="plus"
      class="tool-icon"
      />
    </app-button>

    <app-button
      v-if="options.tools.remove"
      :class="'tool-button round low-contrast'"
      :contentSizePercentage="60"
      @click="remove()"
    >
      <font-awesome-icon 
      icon="trash-alt"
      class="tool-icon"
      />
    </app-button>

    <app-button 
      v-if="options.tools.refresh"
      :class="'tool-button round low-contrast'"
      :contentSizePercentage="65"
      @click="refresh()"
    >
      <font-awesome-icon 
      icon="sync-alt"
      class="tool-icon"
      />
    </app-button>

    <app-input
      v-if="options.tools.filter"
      v-model="filter"
      :id="'app-explorer-input'"
      class="filter-input layer-one round low-contrast low-contrast-border"
      :class="filterInputClasses"
      placeholder="filter"
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
      selectedInteractionId: {
        type: String,
        required: true,
      },
      options: {
        type: Object,
        required: true,
      },
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
  flex-wrap wrap
  padding 0.5em

.tool-button 
  height 1.8em
  width 1.8em
  margin-right 0.5em
  margin-bottom 0.5em

.tool-icon
  height 100%
  width 100%

.filter-input
  flex-grow 1
  min-width 9em
  height 1.8em
</style>
