<template>
  <div
    class="interaction-explorer-toolbar"
  >
    <app-button 
        :class="'tool-button round low-contrast'"
        @click="addDefaultInteraction"
    >
        <font-awesome-icon 
        icon="plus"
        class="tool-icon"
        />
    </app-button>
  </div>
</template>

<script>
    import { mapActions } from 'vuex'


    import { library } from '@fortawesome/fontawesome-svg-core'
    import { faPlus } from '@fortawesome/free-solid-svg-icons'
    library.add(faPlus);

    import uuidv4 from 'uuid/v4';
    import { AppButton} from './../../appComponents/appComponents.js';

    export default { 
        name: 'InteractionExplorerToolbar',
        components: {
            AppButton
        },
        props: {
        },
        methods: {
            ...mapActions('interactions', {
                addInteraction: 'add'
            }),
            addDefaultInteraction: function(){
                let defaultInteraction = {
                id: uuidv4(),
                name: 'New Interaction',
                processingCallback: `(input, output, state) => {

    // Your code here.
    
    output.defaultOut = input.defaultIn;
}`,
                inputFormats: [
                    {
                        internalName: 'defaultIn',
                        messageFormat: 'messageFormat'
                    }
                ],
                outputFormats: [
                    {
                        internalName: 'defaultOut',
                        messageFormat: 'messageFormat'
                    }
                ]
                };

                this.addInteraction({interaction: defaultInteraction})
            }
        }
    } 
</script> 

<style scoped lang="stylus"> 
.interaction-explorer-toolbar
    display flex
    flex-direction row
    padding 0.5em

.tool-button 
    height: 1.5em
    width: 1.5em

.tool-icon
    height: 1em
    width: 1em
</style>
