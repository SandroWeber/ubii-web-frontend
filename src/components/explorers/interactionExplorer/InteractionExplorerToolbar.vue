<template>
  <div
    class="interaction-explorer-toolbar"
  >
    <app-button 
        :class="'tool-button round low-contrast'"
        @click="addDefaultInteraction"
        :contentSizePercentage="70"
    >
        <font-awesome-icon 
        icon="plus"
        class="tool-icon"
        />
    </app-button>

    <app-button 
        :class="'tool-button round low-contrast'"
        @click="deleteInteraction"
        :contentSizePercentage="60"
    >
        <font-awesome-icon 
        icon="trash-alt"
        class="tool-icon"
        />
    </app-button>

    <app-button 
        :class="'tool-button round low-contrast'"
        @click="pullAll"
        :contentSizePercentage="65"
    >
        <font-awesome-icon 
        icon="sync-alt"
        class="tool-icon"
        />
    </app-button>
  </div>
</template>

<script>
    import { mapActions } from 'vuex'


    import { library } from '@fortawesome/fontawesome-svg-core'
    import { faPlus, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
    library.add(faPlus);
    library.add(faTrashAlt);

    import { AppButton} from './../../appComponents/appComponents.js';

    export default { 
        name: 'InteractionExplorerToolbar',
        components: {
            AppButton
        },
        props: {
            selectedInteractionId: String
        },
        methods: {
            deleteInteraction: function(){
                this.$emit('delete')

                this.deleteInteractionAtStore({
                    currentInteractionId: this.selectedInteractionId,
                });
            },
            ...mapActions('interactions', {
                addInteraction: 'add',
                addDefaultInteraction: 'addDefault',
                deleteInteractionAtStore: 'deleteInteraction',
                pullAll: 'pullAll',
            }),
        }
    } 
</script> 

<style scoped lang="stylus"> 
.interaction-explorer-toolbar
    display flex
    flex-direction row
    padding 0.5em

.tool-button 
    height: 1.8em
    width: 1.8em
    margin-right: 0.5em

.tool-icon
    height: 100%
    width: 100%
</style>
