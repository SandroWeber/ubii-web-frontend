<template>
  <app-layer 
    class="app-explorer layer-two background shadow"
    v-on="$listeners"
  >
    <app-explorer-toolbar
      :options="options"
      :selectedRecords="selectedRecords"
      @add="add()"
      @refresh="refresh()"
      @remove="remove()"
    />
    <app-explorer-item
      v-for="record in sortedRecords"
      :key="record.id"
      :label="record.label"
      :id="record.id"
      :selected="isSelected(record)"
      @select="select(record)"
      @select-ctrl="selectControl(record)"
      @select-shift="selectShift(record)"
      @deselect="deselect(record)"
    />
  </app-layer>
</template>

<script>
  import AppExplorerItem from "./AppExplorerItem.vue";
  import AppExplorerToolbar from "./AppExplorerToolbar.vue";
  import AppLayer from './../AppLayer.vue';

  export default {
    name: 'AppExplorer',
    components: {
      AppExplorerItem,
      AppExplorerToolbar,
      AppLayer,
    },
    props: {
      records: {
        type: Array,
        required: true,
      },
      options: {
        type: Object,
        required: false,
        default: function() {
          return {
            sort: 'alphabetically',
            tools: {
              add: true,
              remove: true,
              refresh: true,
              filter: true
            }
          };
        }
      },
    },
    data: function(){
      return {
        selected: []
      }
    },
    computed: {
      sortedRecords: function(){
        if(this.options.sort === 'byDate'){
          // Todo
          let recordsCopy = [...this.records];
          return recordsCopy.sort((a,b) => {
            return a.label.localeCompare(b.label);
          });
        }else{
          let recordsCopy = [...this.records];
          return recordsCopy.sort((a,b) => {
            return a.label.localeCompare(b.label);
          });
        }
      },
      selectedRecords: function(){
        return this.records.filter((record) => this.isSelected(record));
      },
    },
    watch: {
      records: function(){
        // validate selected
        this.selected = this.selected.filter((value) => {
          return this.records.some((record) => record.id === value.id);
        })
      }
    },
    methods: {
      add: function(){
        this.$emit('add');
      },
      remove: function(){
        this.$emit('remove', {
          records: this.selectedRecords
        });

        // All selected records should be deleted -> reset selected.
        this.clearSelected();
      },
      select: function(record){
        this.clearSelected();

        this.selected.push(record);

        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      selectControl: function(record){
        this.selected.push(record);
        // TODO

        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      selectShift: function(record){
        this.selected.push(record);
        // TODO

        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      deselect: function(record){
        this.selected = this.selected.filter((value)=> value.id === record.id);

        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      refresh: function(){
        this.$emit('refresh');

        // refreshed records could miss selected records -> deselect all on refresh
        this.resetSelected();
      },
      isSelected: function(record){
        if(this.selected.length === 0){
          this.resetSelected();
        }
        return this.selected.some((value) => value.id === record.id);
      },
      resetSelected: function(){
        this.clearSelected();

        if(this.selected.length === 0 && this.records.length > 0){
          this.selected.push(this.sortedRecords[0]);
        }

        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      clearSelected: function(){
        this.selected = [];
      },
    },
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"

.app-explorer
  display flex
  flex-direction column
  flex-grow 1
  overflow-y: auto
</style>
