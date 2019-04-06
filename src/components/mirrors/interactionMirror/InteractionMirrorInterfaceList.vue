<template>
  <div class="interaction-mirror-interface-list">
      <interaction-mirror-interface-list-token 
        v-for="element in interfaceList"
        :key="element.internalName"
        :interface="element"
        :interface-key="interfaceKey"
        :editMode="editMode"
        :code="code"
      />

      <app-button 
        :class="'edit-button round low-contrast'"
        @click="toggleEditMode"
      >
        <font-awesome-icon 
        icon="plus"
        class="tool-icon"
        />
    </app-button>
  </div>
</template>

<script>
  import InteractionMirrorInterfaceListToken from "./InteractionMirrorInterfaceListToken.vue";

  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faPlus } from '@fortawesome/free-solid-svg-icons'
  library.add(faPlus);

  import { AppButton} from './../../appComponents/appComponents.js';

  export default { 
    name: 'interactionInterfaceList',
    components: {
      InteractionMirrorInterfaceListToken: InteractionMirrorInterfaceListToken,
      AppButton: AppButton,
    },
    props: {
      interfaceList: Array,
      interfaceKey: String,
      code: String
    },
    data: () => {
      return {
        editMode: false
      }
    },
    methods: {
      toggleEditMode: function (){
        this.editMode= this.editMode !== true;
      }
    }
    
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    justify-content: flex-start
    align-items: flex-start
    align-content: flex-start

  .edit-button
    height: 1.5em
    width: 1.5em
    order: 1
</style>
