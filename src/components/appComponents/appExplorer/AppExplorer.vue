<template>
  <app-layer 
    class="app-explorer layer-two background shadow"
    v-on="$listeners"
  >
    <app-explorer-toolbar
      :selectedRecords="selectedRecords"
      @add="add()"
      @refresh="refresh()"
      @remove="remove()"
    />
    <app-explorer-item
      v-for="record in records"
      :key="record.id"
      :label="record.label"
      :id="record.id"
      :selected="isSelected(record)"
      @select="select(record)"
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
      add: function(){
        this.$emit('add');
      },
      refresh: function(){
        this.$emit('refresh');
      },
      remove: function(){
        this.$emit('remove', {
          records: this.selectedRecords
        });

        // All selected records should be deleted -> reset selected.
        this.selected.clear();
      },
      select: function(record){
        this.selected.push(record);

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
