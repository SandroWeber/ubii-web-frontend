<template>
    <app-layer class="interaction-mirror layer-three background shadow">
        <interaction-mirror-header
            :name="interaction.name"
            :id="interaction.id"
        />
        <interaction-mirror-interface-list :interface-list="interaction.inputFormats"/>
        <div class="code-wrapper layer-three border round">
            <source-code-mirror
                v-model="interaction.processingCallback"
                @input="onCodeChange"
            >
            </source-code-mirror>
        </div>
        <interaction-mirror-interface-list :interfaceList="interaction.outputFormats"/>
    </app-layer>
</template>

<script>
    import InteractionMirrorHeader from './InteractionMirrorHeader.vue';
    import InteractionMirrorInterfaceList from './InteractionMirrorInterfaceList.vue';
    import SourceCodeMirror from './../sourceCodeMirror/SourceCodeMirror.vue';
    import { AppLayer } from './../../appComponents/appComponents.js';
 
    // Fontawesome.
    import { library } from '@fortawesome/fontawesome-svg-core';
    import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
    library.add(faArrowDown);

    export default {
        name: 'InteractionMirror',
        props: {
            interaction: Object
        },
        components: {
            SourceCodeMirror: SourceCodeMirror,
            InteractionMirrorHeader: InteractionMirrorHeader,
            InteractionMirrorInterfaceList: InteractionMirrorInterfaceList,
            AppLayer
        },
        data: () => {
            return {
            };
        },
        methods: {
            onCodeChange: function() {
                this.$emit('changes', this.interaction);
            }
        }
    }
</script>

<style scoped lang="stylus">
    .interaction-mirror
        height 100%
        padding: 10px
        flex-grow: 1

    .code-wrapper
        text-align: left
        margin: 10px
</style>
