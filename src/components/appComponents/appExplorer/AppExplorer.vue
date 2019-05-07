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
      :selected="record.selected"
      @select="selectRecord(record)"
      @deselect="deselectRecord(record)"
    />
  </app-layer>
</template>

<script>
  export default {
    name: 'AppExplorer',
    props: {
      records: Array,
    },
    computed: {
      selectedRecords: function(){
        // TODO return all records that are flagged with selected or the first 
      },
    },
    methods: {
      deleteRecords: function(){
        // TODO delete currently selected records
      },
      selectRecord: function(record){
        record.selected = true;
      },
      deselectRecord: function(record){
        record.selected = false;
      },
    }
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
