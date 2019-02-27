<template>
    <div
        class="node-editor layer-one background">
        <node-mirror/>
    </div>
</template>

<script>
    import nodeMirror from './../../mirrors/nodeMirror/nodeMirror.vue';

    export default {
        name: 'nodeEditor',
        props: {},
        components: {
            nodeMirror: nodeMirror
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
