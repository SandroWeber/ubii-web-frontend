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
      v-for="record in filteredAndSortedRecords"
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
      /**
       * The records filtered and sorted.
       * @return {Object[]}
       */
      filteredAndSortedRecords: function(){
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
      /**
       * All selected records.
       * @return {Object[]}
       */
      selectedRecords: function(){
        return this.records.filter((record) => this.isSelected(record));
      },
    },
    watch: {
      records: function(){
        // Clean up selected when records changes.
        this.selected = this.selected.filter((value) => {
          return this.records.some((record) => record.id === value.id);
        })

        this.enforceSelectionRequirements();
      }
    },
    methods: {
      /**
       * Triggers an Add event. This is emitted to the external and solved internally.
       */
      add: function(){
        this.$emit('add');
      },
      /**
       * Triggers a Remove event. This is emitted to the external and solved internally.
       */
      remove: function(){
        this.$emit('remove', {
          records: this.selectedRecords
        });

        // All selected records should be deleted -> reset the selected records.
        this.resetSelected();
      },
      /**
       * Triggers a Refresh event. This is emitted to the external and solved internally.
       */
      refresh: function(){
        this.$emit('refresh');

        // Updated records could no longer contain selected records -> reset the selected records.
        this.resetSelected();
      },
      /**
       * A normal select action. Triggers a Select event. This is solved internally and emitted to the external.
       */
      select: function(record){
        // Clear selected for a normal select.
        this.clearSelected();

        // Select the current record.
        this.selected.push(record);

        this.emitSelectEvent();
      },
      /**
       * A ctrl select action. Triggers a Select event. This is solved internally and emitted to the external.
       */
      selectControl: function(record){
        // Depending on whether the element has already been selected...
        if(this.isSelected(record)){
          // ... the element is deselected...
          this.selected = this.selected.filter((value) => value.id !== record.id);
        }else{
          // ... or the element is selected otherwise.
          this.selected.push(record);
        }

        this.emitSelectEvent();
      },
      /**
       * A shift select action. Triggers a Select event. This is solved internally and emitted to the external.
       */
      selectShift: function(record){
        // The shift select does only work if there is already an element selected.
        if(this.selected.length > 0){
          // Get the currently rendered array of records in the correct order.
          let currentlyRenderedRecords = this.filteredAndSortedRecords;
          
          // Get the index from the first element of the selected records in the currently rendered list.
          let indexFirst = currentlyRenderedRecords.findIndex((value)=> value.id === this.selected[0].id);
          // Get the index from the current element in the currently rendered list.
          let indexCurrent = currentlyRenderedRecords.findIndex((value)=> value.id === record.id);

          // Iterate from first to current and select each entry if it is not already selected.
          for (let i = indexFirst;
            (indexFirst<=indexCurrent && i<=indexCurrent) || (indexFirst>indexCurrent && i>=indexCurrent);
            (indexFirst<=indexCurrent) ? i++ : i--) {
              if(this.isSelected(currentlyRenderedRecords[i]) !== true){
                this.selected.push(currentlyRenderedRecords[i]);
              }
          }

          this.emitSelectEvent();
        }
      },
      /**
       * Determines if the passed record is currently selected.
       * @return {boolean}
       */
      isSelected: function(record){
        return this.selected.some((value) => value.id === record.id);
      },
      /**
       * Resets the selected records.
       */
      resetSelected: function(){
        this.clearSelected();

        this.enforceSelectionRequirements();

        this.emitSelectEvent();
      },
      clearSelected: function(){
        this.selected = [];
      },
      enforceSelectionRequirements: function(){
        // Select a record if the alwaysSelected option is set to true.
        if(this.selected.length === 0 && this.records.length > 0 && this.options.alwaysSelected){
          this.selected.push(this.filteredAndSortedRecords[0]);
        }
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
    mounted: function(){
      this.resetSelected();
    }
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
