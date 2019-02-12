<template>
    <div class="interaction-explorer layer-two background shadow">
        <interaction-item v-for="element in interactions" :key="element.name" :name="element.name" :id="element.id" @select="onSelectItem"/>
    </div>
</template>

<script>
    import interactionItem from "./interactionItem.vue";

    export default {
        name: 'interactionExplorer',
        props: {
            interactions: Array
        },
        components: {
            interactionItem: interactionItem
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
