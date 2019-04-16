<template>
    <div>
        <div class="interaction-editor layer-one background">
            <interaction-explorer
                class="interaction-explorer-instance"
                :interactions="interactions"
                :selectedInteractionId="selectedInteraction.id"
                @selectInteraction="onSelectInteraction"
            />
            <interaction-mirror    
                v-model="selectedInteraction"
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
            selectedInteraction: {
                get: function () {
                    let id = this.selectedInteractionId;
                    if(this.interactions.has(id))
                    {
                        return this.interactions.get(id);
                    }else{
                        if(this.interactions.length > 0){
                            return this.interactions.values().next().value;
                        }else{
                            return {};
                        }
                        
                    }
                },
                set: function (newValue) {
                    console.log("UPDATEEE")
                    this.updateInteraction({
                        currentInteractionId: this.selectedInteractionId,
                        interaction: newValue
                    });
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
            ...mapActions('interactions', {
                addInteraction: 'add',
                updateInteraction: 'update',
                pullAll: 'pullAll',
                startSynchronizationService: 'startSynchronizationService',
                stopSynchronizationService: 'stopSynchronizationService'
            }),
        },
        mounted: async function(){
            await this.pullAll();
            await this.startSynchronizationService();
            console.log(this.interactions)
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

    .interaction-explorer-instance
        width 300px
</style>
