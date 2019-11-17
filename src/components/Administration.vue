<template>
  <div>
    <!--<treeselect 
      v-model="treeSelect.value"
      :multiple="false"
      :options="treeSelect.options"
      class="tree-select"
    />-->

    <div class="grid">
      <!--<router-link to="/administration/nodeEditor" class="grid-link" tag="div">
        <app-tile class="layer-three background round shadow green-accent">
          <font-awesome-icon icon="random" class="grid-icon" />
          <p>Session Editor</p>
        </app-tile>
      </router-link>-->

      <router-link to="/administration/interactionEditor" class="grid-link" tag="div">
        <app-tile class="layer-three background round shadow green-accent">
          <font-awesome-icon icon="microchip" class="grid-icon" />
          <p>Interaction Editor</p>
        </app-tile>
      </router-link>

      <router-link to="/administration/sessionEditor" class="grid-link" tag="div">
        <app-tile class="layer-three background round shadow green-accent">
          <font-awesome-icon icon="project-diagram"  class="grid-icon" />
          <p>Session Editor</p>
        </app-tile>
      </router-link>
    </div>
  </div>
</template>

<script>
import { AppTile } from './appComponents/appComponents.js';

// Treeselect.
//import Treeselect from '@riophae/vue-treeselect';
import '@riophae/vue-treeselect/dist/vue-treeselect.css';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRandom, faMicrochip, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
library.add(faRandom, faMicrochip, faProjectDiagram);

/*let dummyTreeselectOptions = [
  {
    id: 'sessions-parent',
    label: 'Sessions',
    children: [
      {
        id: 'session-1',
        label: 'Session 1',
        children: [
          {
            id: 'interaction-1',
            label: 'Interaction 1'
          },
          {
            id: 'interaction-2',
            label: 'Interaction 2'
          }
        ]
      }
    ]
  },
  {
    id: 'devices-parent',
    label: 'Devices',
    children: [
      {
        id: 'device-a',
        label: 'Device A'
      },
      {
        id: 'device-b',
        label: 'Device B'
      }
    ]
  }
];*/

export default {
  name: 'Administration',
  props: {},
  components: {
    //Treeselect,
    AppTile
  },
  data: () => {
    return {
      /*treeSelect: {
        value: [],
        options: dummyTreeselectOptions
      }*/
    };
  }
};
</script>

<style scoped lang="stylus">
.tree-select {
  margin: 10px;
}

.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin: 25px;
}

.grid-link {
  text-align: center;
  cursor: pointer;
}

.grid-icon {
  width: 50px;
  height: 50px;
}
</style>
