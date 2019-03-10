<template>
    <div>
        <div class="interaction-editor layer-one background">
            <interaction-explorer   
                :interactions="interactions"
                :selectedInteractionId="selectedInteraction.id"
                @selectInteraction="onSelectInteraction"
            />
            <interaction-mirror    
                :interaction="selectedInteraction"
                @changes="onSelectedInteractionChange"
            />
        </div>
    </div>
</template>

<script>
    import InteractionExplorer from './../../explorers/interactionExplorer/InteractionExplorer.vue';
    import InteractionMirror from './../../mirrors/interactionMirror/InteractionMirror.vue';
    import { mapState, mapActions } from 'vuex'

    // Dummy interaction.
    let dummyInteractionOne =
    {
        id: '1234',
        name: 'Dummy Interaction One',
        processingCallback: `(input, output, state) => {
    return true;
}`,
    inputFormats: [
        {
            internalName: 'input-A',
            messageFormat: 'topic-A'
        },
        {
            internalName: 'input-B',
            messageFormat: 'topic-B'
        }
    ],
    outputFormats: [
        {
            internalName: 'output-X',
            messageFormat: 'topic-X'
        },
        {
            internalName: 'output-Y',
            messageFormat: 'topic-Y'
        }
    ]
    };

    let dummyInteractionTwo = {
    id: 'uuidv4()',
    name: 'mirror-mouse-pointer',
    processingCallback: `(input, output, state) => {
    return true;
}`,
    inputFormats: [
        {
            internalName: 'inputClientPointer.internalName',
            messageFormat: 'inputClientPointer.messageFormat'
        },
        {
            internalName: 'inputMirror.internalName',
            messageFormat: 'inputMirror.messageFormat'
        }
    ],
    outputFormats: [
        {
            internalName: 'outputServerPointer.internalName',
            messageFormat: 'outputServerPointer.messageFormat'
        }
    ]
    };

    let dummyInteractionThree = {
  id: 'three',
  name: 'mirror-mouse-pointer',
  processingCallback: `(input, output, state) => {
  return true;
}`,
    inputFormats: [
        {
            internalName: 'inputClientPointer.internalName',
            messageFormat: 'inputClientPointer.messageFormat'
        },
        {
            internalName: 'inputMirror.internalName',
            messageFormat: 'inputMirror.messageFormat'
        }
    ],
    outputFormats: [
        {
            internalName: 'outputServerPointer.internalName',
            messageFormat: 'outputServerPointer.messageFormat'
        }
    ]
    };

    export default {
        name: 'InteractionEditor',
        props: {},
        components: {
            InteractionExplorer: InteractionExplorer,
            InteractionMirror: InteractionMirror
        },
        data: () => {
            return {
                selectedInteractionId: 0,
            };
        },
        computed: {
            selectedInteraction: function (){
                let id = this.selectedInteractionId;
                let found = this.interactions.find(function(element) {
                    return element.id === id;
                });
                if(found)
                {
                    return found;
                }else{
                    return this.interactions[0];
                }
            },
            ...mapState({
                interactions: state => state.interactions.all
            })
        },
        methods: {
            onSelectInteraction: function(id) {
                this.selectedInteractionId = id;
            },
            onSelectedInteractionChange: function(input){
                this.selectedInteraction = input;
            },
            ...mapActions({
                addInteraction: function(){
                    //this.$store.commit('increment');
                }
            }),
        },
        mounted(){
            this.$store.dispatch("interactions/add", {interaction: dummyInteractionOne});
            this.$store.dispatch("interactions/add", {interaction: dummyInteractionTwo});
            this.$store.dispatch("interactions/add", {interaction: dummyInteractionThree});
        }
    }
</script>

<style scoped lang="stylus">
    .interaction-editor
        height: 100%
        display: flex
        flex-direction: row
        flex-wrap: nowrap
        justify-content: flex-start
        align-items flex-start
        align-content flex-starts
</style>
