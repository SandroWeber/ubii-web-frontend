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
                set: function (newValue) {
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
                pullAll: 'pullAll'
            }),
        },
        mounted: function(){
            this.pullAll();
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
