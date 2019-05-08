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
    data: function(){
      return {
        selected: []
      }
    },
    computed: {
      selectedRecords: function(){
        return records.filter((record) => selected.some((selected) => selected.id === record.id));
      },
    },
    methods: {
      deleteRecords: function(){
        this.$emit('delete', {
          records: selectedRecords()
        });

        // All selected records should be deleted -> reset selected.
        selected.clear();
      },
      selectRecord: function(record){
        selected.push(record);
      },
      deselectRecord: function(record){
        selected = selected.filter((value)=> value.id === record.id);
      },
    }
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
