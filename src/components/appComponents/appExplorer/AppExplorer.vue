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
        return records.filter((record) => isSelected(record));
      },
      isSelected: function(record){
        return selected.some((selected) => selected.id === record.id);
      }
    },
    methods: {
      delete: function(){
        this.$emit('delete', {
          records: selectedRecords()
        });

        // All selected records should be deleted -> reset selected.
        selected.clear();
      },
      add: function(){
        this.$emit('add');
      },
      select: function(record){
        selected.push(record);

        this.$emit('select', {
          records: selectedRecords()
        });
      },
      deselect: function(record){
        selected = selected.filter((value)=> value.id === record.id);

        this.$emit('select', {
          records: selectedRecords()
        });
      },
      refresh: function(){
        this.$emit('refresh');

        // refreshed records could miss selected records -> deselect all on refresh
        selected.clear();
      }
    }
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
