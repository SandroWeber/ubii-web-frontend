<template>
    <div class="interaction-explorer layer-two background shadow">
        <interaction-explorer-item
            v-for="element in interactions"
            :key="element.name"
            :name="element.name"
            :id="element.id"
            :selected="element.id === selectedInteractionId"
            @select="onSelectItem"
        />
    </div>
</template>

<script>
    import InteractionExplorerItem from "./InteractionExplorerItem.vue";

    export default {
        name: 'InteractionExplorer',
        props: {
            interactions: Array,
            selectedInteractionId: String
        },
        components: {
            InteractionExplorerItem: InteractionExplorerItem
        },
        data: () => {
            return {
            };
        },
        methods: {
            onSelectItem: function(id){
                this.$emit('selectInteraction', id)
            }
        }
    }
</script>

<style scoped lang="stylus">
    .interaction-explorer
        height: 100%
        min-width 200px
        flex-grow: 0
</style>
