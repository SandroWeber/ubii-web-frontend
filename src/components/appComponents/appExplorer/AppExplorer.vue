<template>
    <app-layer class="app-explorer layer-two background shadow">
    <app-explorer-toolbar
      :selectedRecords="selectedRecords"
      @delete="deleteRecords()"
    />
    <app-explorer-item
      v-for="record in records"
      :key="record.id"
      :label="record.label"
      :id="record.id"
      :selected="isSelected(record)"
      @select="selectRecord(record)"
      @deselect="deselectRecord(record)"
    />
  </app-layer>
</template>

<script>
  import AppExplorerItem from "./AppExplorerItem.vue";
  import AppExplorerToolbar from "./AppExplorerToolbar.vue";
  import { AppLayer } from './../appComponents.js';

  export default {
    name: 'AppExplorer',
    components: {
      AppExplorerItem,
      AppExplorerToolbar,
      AppLayer,
    },
    props: {
      records: Array,
    },
    data: function(){
      return {
        selected: []
      }
    },
    computed: {
      selectedRecords: function(){
        return this.records.filter((record) => this.isSelected(record));
      },
    },
    methods: {
      deleteRecords: function(){
        this.$emit('delete', {
          records: this.selectedRecords()
        });

        // All selected records should be deleted -> reset selected.
        this.selected.clear();
      },
      addRecord: function(){
        this.$emit('add');
      },
      selectRecord: function(record){
        this.selected.push(record);

        this.$emit('select', {
          records: this.selectedRecords()
        });
      },
      deselectRecord: function(record){
        this.selected = this.selected.filter((value)=> value.id === record.id);

        this.$emit('select', {
          records: this.selectedRecords()
        });
      },
      refreshRecords: function(){
        this.$emit('refresh');

        // refreshed records could miss selected records -> deselect all on refresh
        this.selected.clear();
      },
      isSelected: function(record){
        return this.selected.some((value) => value.id === record.id);
      }
    }
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
