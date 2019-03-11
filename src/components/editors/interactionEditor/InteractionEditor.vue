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
            ...mapActions('interactions', {
                addInteraction: 'add'
            }),
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
