<template>
    <div class="settings-container">
        <b-form-group label="Graph:">
            <b-form-select v-model="selectedView" :options="viewOptions" @input="changeView"></b-form-select>
        </b-form-group>
        <div v-if="selectedView == 1">
            <b-form-group label="Mode:">
                <b-form-select v-model="selectedMode" :options="modeOptions" @input="changeMode"></b-form-select>
            </b-form-group>
            <div class="help-container" v-if="selectedView == 1">
                <font-awesome-icon
                        icon="question-circle"
                        class="icon"
                />
                <span v-if="selectedMode == 0">Browse the graph without 9 individually usable Layers.</span>
                <span v-if="selectedMode == 1">Sort your Nodes in Layers depending on how which tags (or combination of tags) they reference.</span>
                <span v-if="selectedMode == 2">Sort your Nodes in Layers depending on how many edges flow into a node / out of a node.</span>
            </div>
            <div v-if="selectedMode == 2">
                <b-form-group label="Sorting:">
                    <b-form-select v-model="selectedSorting" :options="sortingOptions" @input="changeSorting"></b-form-select>
                </b-form-group>
            </div>
        </div>
    </div>
</template>

<script>
  import 'bootstrap/dist/css/bootstrap.css';
  import 'bootstrap-vue/dist/bootstrap-vue.css';
  import { BFormSelect, BFormGroup } from 'bootstrap-vue';

  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
  library.add(faQuestionCircle);

  export default {
    name: 'SettingsContainer',
    components: {
      'b-form-select': BFormSelect,
      'b-form-group': BFormGroup
    },
    props: {
      eventBus: {
        type: Object
      },
      settings: {
        type: Object
      }
    },
    data: function() {
      return {
        selectedView: this.settings.view,
        selectedMode: this.settings.mode,
        selectedSorting: this.settings.sorting,
        viewOptions: [
          { value: 0, text: 'Force-Graph' },
          { value: 1, text: 'Layered Graph' },
          { value: 2, text: 'Grouped Graph'}
        ],
        modeOptions: [
          { value: 0, text: 'Browsing' },
          { value: 1, text: 'Tags' },
          { value: 2, text: 'Input/Output Connections'},
        ],
        sortingOptions: [
          { value: 0, text: 'Incoming Edges' },
          { value: 1, text: 'Outgoing Edges' },
          { value: 2, text: 'Incoming & Outgoing Edges'},
        ]
      };
    },
    watch: {
    },
    methods: {
      init: function() {
      },
      changeView: function(view) {
        this.$emit('change', 'view', view);
      },
      changeMode: function(mode) {
        this.$emit('change', 'mode', mode);
      },
      changeSorting: function(sorting) {
        this.$emit('change', 'sorting', sorting);
      }
    },
    mounted() {
      this.init();
    }
  };
</script>

<style scoped>
    .settings-container {
        padding: 20px;
        font-size: 1.2em;
    }

    .help-container {
        font-size: 0.8em;
        font-style: italic;
        margin-bottom: 15px;
    }

    .icon {
        margin-right: 10px;
    }
</style>