<template>
  <app-layer class="app-explorer layer-two background shadow">
    <app-explorer-toolbar
      :options="options"
      :selectedRecords="selectedRecords"
      @add="add()"
      @save="save()"
      @refresh="refresh()"
      @remove="remove()"
      @filter="onFilterChange"
    />
    <div>
      <div v-for="category in categories" :key="category.title">
        <AppCollapseSectionHeader
          :title="category.title"
          :targetID="'explorer-items-' + category.title"
          :initiallyCollapsed="false"
        />
        <div :id="'explorer-items-' + category.title">
          <app-explorer-item
            v-for="record in records.filter(filterByUserInput).filter(category.filter).sort(globalSorting)"
            :key="record.name"
            :id="record.id"
            :label="record.label"
            :selected="isSelected(record)"
            @select="select(record)"
            @select-ctrl="selectControl(record)"
          />
        </div>
      </div>
    </div>
  </app-layer>
</template>

<script>
import AppExplorerItem from './AppExplorerItem.vue';
import AppExplorerToolbar from './AppExplorerToolbar.vue';
import AppLayer from './../AppLayer.vue';
import AppCollapseSectionHeader from '../AppCollapseSectionHeader.vue';

/**
 * Implementation of a general explorer as app component that...
 * <ul>
 *  <li> ...accepts a list of records.
 *  <li> ...renders it ordered with regard to a specific schema (only alphabetically for now).
 *  <li> ...does not mutate the data.
 *  <li> ...lets you adjust the required features according to forwarded options.
 *  <li> ...lets you add records.
 *  <li> ...lets you delete entries.
 *  <li> ...lets you refresh the binded data.
 *  <li> ...lets you select entries. (normal, multiselection with ctrl and shift)
 *  <li> ...lets you filter entries based on a string.
 * </ul>
 */
export default {
  name: 'AppExplorer',
  components: {
    AppExplorerItem,
    AppExplorerToolbar,
    AppLayer,
    AppCollapseSectionHeader
  },
  props: {
    records: {
      type: Array,
      required: true
    },
    categories: {
      type: Array,
      required: false,
      default: function() {
        return [
          {
            title: 'All',
            filter: () => {
              return true;
            }
          }
        ];
      }
    },
    options: {
      type: Object,
      required: false,
      default: function() {
        return {
          sort: 'alphabetically',
          tools: {
            add: true,
            save: true,
            remove: true,
            refresh: true,
            filter: true
          },
          alwaysSelected: true
        };
      }
    }
  },
  data: function() {
    return {
      selected: [],
      filterValue: ''
    };
  },
  computed: {
    /**
     * All selected records.
     * @return {Object[]}
     */
    selectedRecords: function() {
      return this.records.filter(record => this.isSelected(record));
    }
  },
  watch: {
    records: function() {
      // Clean up selected when records changes.
      this.selected = this.selected.filter(value => {
        return this.records.some(record => record.id === value.id);
      });
    },
    selected: function() {
      this.emitSelectEvent();
    }
  },
  methods: {
    /**
     * Triggers an Add event. This is emitted to the external and solved internally.
     */
    add: function() {
      this.$emit('add');
    },
    /**
     * Triggers a Save event. This is emitted to the external and solved internally.
     */
    save: function() {
      this.$emit('save', {
        records: this.selectedRecords
      });
    },
    /**
     * Triggers a Remove event. This is emitted to the external and solved internally.
     */
    remove: function() {
      this.$emit('remove', {
        records: this.selectedRecords
      });

      // All selected records should be deleted -> reset the selected records.
      this.resetSelected();
    },
    /**
     * Triggers a Refresh event. This is emitted to the external and solved internally.
     */
    refresh: function() {
      this.$emit('refresh');

      // Updated records could no longer contain selected records -> reset the selected records.
      this.resetSelected();
    },
    /**
     * A normal select action. This is solved internally and emitted to the external.
     */
    select: function(record) {
      // Clear selected for a normal select.
      this.clearSelected();

      // Select the current record.
      this.selected.push(record);
    },
    /**
     * A ctrl select action. This is solved internally and emitted to the external.
     */
    selectControl: function(record) {
      // Depending on whether the element has already been selected...
      if (this.isSelected(record)) {
        // ... the element is deselected...
        this.selected = this.selected.filter(value => value.id !== record.id);
      } else {
        // ... or the element is selected otherwise.
        this.selected.push(record);
      }
    },
    /**
     * Determines if the passed record is currently selected.
     * @return {boolean}
     */
    isSelected: function(record) {
      return this.selected.some(value => value.id === record.id);
    },
    /**
     * Resets the selected records.
     */
    resetSelected: function() {
      this.clearSelected();
    },
    clearSelected: function() {
      this.selected = [];
    },
    emitSelectEvent: function() {
      this.$emit('select', {
        records: this.selectedRecords
      });
    },
    onFilterChange: function(value) {
      this.filterValue = value;
    },
    filterByUserInput: function(record) {
      if (this.filterValue === '') {
        return true;
      }

      return record.label.includes(this.filterValue);
    },
    globalSorting: function() {
      if (this.sort === 'alphabetically') {
        return undefined; // default sorting is aphabetical
      }

      return undefined;
    }
  },
  mounted: function() {
    this.resetSelected();
  }
};
</script>

<style scoped lang="stylus">
@import './../../styles/main/color';

.app-explorer {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
}

.records-section-header {
  margin-top: 10px;
}
</style>
