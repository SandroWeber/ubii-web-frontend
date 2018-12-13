<template>
  <div>
    <treeselect v-model="treeSelect.value" :multiple="false" :options="treeSelect.options" class="tree-select" />
    <interaction-editor />
  </div>
</template>

<script>
  // Treeselect
  import Treeselect from '@riophae/vue-treeselect'
  import '@riophae/vue-treeselect/dist/vue-treeselect.css'

  import InteractionEditor from './InteractionEditor.vue'

  let dummyTreeselectOptions = [{
    id: 'sessions-parent',
    label: 'Sessions',
    children: [{
      id: 'session-1',
      label: 'Session 1',
      children: [{
        id: 'interaction-1',
        label: 'Interaction 1',
      }, {
        id: 'interaction-2',
        label: 'Interaction 2',
      }]
    }],
  }, {
    id: 'devices-parent',
    label: 'Devices',
    children: [{
      id: 'device-a',
      label: 'Device A',
    }, {
      id: 'device-b',
      label: 'Device B',
    }],
  }];

  export default {
    name: 'Administration',
    props: {},
    components: {
      InteractionEditor,
      Treeselect
    },
    data: () => {
      return {
        treeSelect: {
          value: [],
          options: dummyTreeselectOptions
        }
      };
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .tree-select {
    margin: 10px;
  }
</style>
