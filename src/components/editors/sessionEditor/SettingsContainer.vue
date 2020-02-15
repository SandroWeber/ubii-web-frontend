<template>
    <div class="settings-container">
        <b-form-select v-model="selected" :options="options" @input="changeView"></b-form-select>
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
      },
      settings: {
        type: Object
      }
    },
    data: function() {
      return {
        selected: this.settings.view,
        options: [
          { value: 0, text: 'Simple 3D Force-Graph' },
          { value: 1, text: 'Custom 3D Graph' }
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