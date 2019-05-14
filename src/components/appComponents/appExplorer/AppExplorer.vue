<template>
  <app-layer 
    class="app-explorer layer-two background shadow"
  >
    <app-explorer-toolbar
      :options="options"
      :selectedRecords="selectedRecords"
      @add="add()"
      @refresh="refresh()"
      @remove="remove()"
      @filter="filter"
    />
    <app-explorer-item
      v-for="record in sortedAndFilteredRecords"
      :key="record.id"
      :id="record.id"
      :label="record.label"
      :selected="isSelected(record)"
      @select="select(record)"
      @select-ctrl="selectControl(record)"
      @select-shift="selectShift(record)"
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
            },
            alwaysSelected: true
          };
        }
      },
    },
    data: function(){
      return {
        selected: [],
        filterValue: ""
      }
    },
    computed: {
      sortedAndFilteredRecords: function(){
        // Get all relevant records:
        let recordsCopy;
        if(this.filterValue !== ""){
          // Get the filtered records if the filter value is non-empty...
          recordsCopy = this.records.filter((record) => record.label.includes(this.filterValue));
        }else{
          // ... or get them all otherwise.
          recordsCopy = [...this.records];
        }

        // Sort the records.
        if(this.options.sort === 'byDate'){
          // Todo. Currently no date is required in the records data structure -> not possible to sort by date.
          recordsCopy = recordsCopy.sort((a,b) => {
            return a.label.localeCompare(b.label);
          });
        }else{
          // Default sort mode is alphabetically.
          recordsCopy = recordsCopy.sort((a,b) => {
            return a.label.localeCompare(b.label);
          });
        }

        return recordsCopy;
      },
      selectedRecords: function(){
        return this.records.filter((record) => this.isSelected(record));
      },
    },
    watch: {
      records: function(){
        // Clean up selected.
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
      refresh: function(){
        this.$emit('refresh');

        // Refreshed records could miss selected records -> deselect all on refresh
        this.resetSelected();
      },
      select: function(record){
        // Clear selected for a normal select.
        this.clearSelected();

        this.selected.push(record);

        this.emitSelectEvent();
      },
      selectControl: function(record){
        if(this.isSelected(record)){
          // Deselect.
          this.selected = this.selected.filter((value) => value.id !== record.id);
        }else{
          // Select.
          this.selected.push(record);
        }

        this.emitSelectEvent();
      },
      selectShift: function(record){
        if(this.selected.length > 0){
          let currentlyRenderedRecords = this.sortedAndFilteredRecords;
          
          let indexFirst = currentlyRenderedRecords.findIndex((value)=> value.id === this.selected[0].id);
          let indexCurrent = currentlyRenderedRecords.findIndex((value)=> value.id === record.id);

          // Iterate from first to current and push each entry to selected.
          for (let i = indexFirst;
            (indexFirst<=indexCurrent && i<=indexCurrent) || (indexFirst>indexCurrent && i>=indexCurrent);
            (indexFirst<=indexCurrent) ? i++ : i--) {
            this.selected.push(currentlyRenderedRecords[i]);
          }

          this.emitSelectEvent();
        }
      },
      isSelected: function(record){
        // If no record is selected reset selected so that the default one gets selected.
        if(this.selected.length === 0 && this.options.alwaysSelected){
          this.resetSelected();
        }

        return this.selected.some((value) => value.id === record.id);
      },
      resetSelected: function(){
        this.clearSelected();

        if(this.selected.length === 0 && this.records.length > 0 && this.options.alwaysSelected){
          this.selected.push(this.sortedAndFilteredRecords[0]);
        }

        this.emitSelectEvent();
      },
      clearSelected: function(){
        this.selected = [];
      },
      emitSelectEvent: function(){
        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      filter: function(value){
        this.filterValue = value;
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
  overflow-y auto
</style>
