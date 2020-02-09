<template>
    <div class="settings-container">
        <b-form-select v-model="selected" :options="options"></b-form-select>
    </div>
</template>

<script>
  import 'bootstrap/dist/css/bootstrap.css';
  import 'bootstrap-vue/dist/bootstrap-vue.css';
  import { BFormSelect } from 'bootstrap-vue';

  export default {
    name: 'SettingsContainer',
    components: {
      'b-form-select': BFormSelect
    },
    props: {
      eventBus: {
        type: Object
      }
    },
    data: function() {
      return {
        selected: 1,
        options: [
          { value: 0, text: 'Simple 3D Force-Graph' },
          { value: 1, text: 'Visualization with Topics' }
        ]
      };
    },
    watch: {
      selected: function(val) {
        this.eventBus.$emit('view-change', val);
      }
    },
    methods: {
      init: function() {
        setTimeout(() => {
          this.eventBus.$emit('view-change', this.selected);
        }, 100);
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
</style>