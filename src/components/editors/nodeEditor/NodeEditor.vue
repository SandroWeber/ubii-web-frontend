<template>
    <div class="node-editor layer-one background">
        <node-mirror/>
    </div>
</template>

<script>
    import NodeMirror from './../../mirrors/nodeMirror/NodeMirror.vue';

    export default {
        name: 'NodeEditor',
        props: {},
        components: {
            NodeMirror: NodeMirror
        },
        data: () => {
            return {
            };
        },
        computed: {
        },
        methods: {
        }
    }
</script>

<style scoped lang="stylus">
    .node-editor
        height: 100%
        display: flex
        flex-direction: row
        flex-wrap: nowrap
        justify-content: flex-start
        align-items flex-start
        align-content flex-starts
</style>
