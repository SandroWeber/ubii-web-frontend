<template>
    <app-layer class="interaction-explorer layer-two background shadow">
        <interaction-explorer-toolbar
        />
        <interaction-explorer-item
            v-for="element in interactions"
            :key="element.id"
            :name="element.name"
            :id="element.id"
            :selected="element.id === selectedInteractionId"
            @select="onSelectItem"
        />
    </app-layer>
</template>

<script>
    import InteractionExplorerItem from "./InteractionExplorerItem.vue";
    import InteractionExplorerToolbar from "./InteractionExplorerToolbar.vue";
    import { AppLayer } from './../../appComponents/appComponents.js';

    export default {
        name: 'InteractionExplorer',
        props: {
            interactions: Array,
            selectedInteractionId: String
        },
        components: {
            InteractionExplorerItem,
            InteractionExplorerToolbar,
            AppLayer
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
        min-width 300px
        width: 100%
        overflow: hidden
        flex-grow: 0
        display flex
        flex-direction column
</style>
