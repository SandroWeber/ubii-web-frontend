<template>
    <div class="interaction-mirror layer-three background shadow">
        <interaction-header
            :name="interaction.name"
            :id="interaction.id"
        />
        <interaction-interface-list :interface-list="interaction.input"/>
        <div class="code-wrapper layer-three border round">
            <codeMirror
                v-model="interaction.code"
                @input="onCodeChange"
            >
            </codeMirror>
        </div>
        <interaction-interface-list :interfaceList="interaction.output"/>
    </div>
</template>

<script>
    import interactionHeader from './interactionHeader.vue';
    import interactionInterfaceList from './interactionInterfaceList.vue';

    // Codemirror.
    import codeMirror from './../codeMirror/codeMirror.vue';
 
    // Fontawesome.
    import { library } from '@fortawesome/fontawesome-svg-core';
    import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
    library.add(faArrowDown);

    export default {
        name: 'interactionMirror',
        props: {
            interaction: Object
        },
        components: {
            codeMirror: codeMirror,
            interactionHeader: interactionHeader,
            interactionInterfaceList: interactionInterfaceList,
        },
        data: () => {
            return {
            };
        },
        methods: {
            onCodeChange: function(value) {
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
