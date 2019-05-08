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
    watch: {
      
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
        this.resetSelected();
      },
      select: function(record){
        this.clearSelected();

        this.selected.push(record);

        this.$emit('select', {
          records: this.selectedRecords
        });
      },
      selectControl: function(record){
        console.log("selectControl")
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
          this.selected.push(this.records[0]);
        }
      },
      clearSelected: function(){
        this.selected = [];
      }
    },
    mounted: function(){
      console.log("mounted");
      this.resetSelected();
    },
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
