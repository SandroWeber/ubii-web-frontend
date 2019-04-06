<template>
  <div class="interaction-mirror-interface-list">
      <interaction-mirror-interface-list-token 
        v-for="(element, index) in localValue"
        :key="index"
        :index="index"
        v-model="localValue[index]"
        :interface-key="interfaceKey"
        :editMode="editMode"
        :code="code"
        @removeInterfaceEntry="removeInterfaceEntry"
      />

      <app-button 
        v-if="editMode"
        :class="'tool-button add-interface-entry-button round low-contrast'"
        @click="addInterfaceEntry"
      >
        <font-awesome-icon 
        icon="plus"
        class="tool-icon"
        />
      </app-button>

      <app-button 
        :class="'tool-button edit-button round low-contrast'"
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
      value: Array,
      interfaceKey: String,
      code: String
    },
    data: () => {
      return {
        editMode: false
      }
    },
    computed:{
      localValue: {
        get() {
            return this.value
        },
        set(localValue) {
            this.$emit('input', localValue)
        }
      },
    },
    methods: {
      toggleEditMode: function (){
        this.editMode= this.editMode !== true;
      },
      addInterfaceEntry: function(){
        this.localValue.push({
              "internalName": "defaultIn",
              "messageFormat": "messageFormat"
          });
      },
      removeInterfaceEntry: function(index){
        this.localValue.splice(index, 1);
      }
    }
    
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list
    display: flex
    flex-direction: row
    flex-wrap: wrap
    justify-content: flex-start
    align-items: flex-start
    align-content: flex-start

  .tool-button
    width: 27px
    height: 27px
    order: 1
    margin: 5px
</style>
