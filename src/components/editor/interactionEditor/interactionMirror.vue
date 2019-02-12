<template>
    <div class="interaction-mirror layer-three background shadow">
        <interaction-header :name="interaction.name" :id="interaction.id"/>

        <interaction-interface-list :interface-list="interaction.input"/>

        <div class="code-wrapper layer-three border round">
            <codemirror v-model="interaction.code" @input="onCodeChange" :options="codemirror.options"></codemirror>
        </div>

        <interaction-interface-list :interfaceList="interaction.output"/>
    </div>
</template>

<script>
    import interactionHeader from './interactionHeader.vue';
    import interactionInterfaceList from './interactionInterfaceList.vue';

    // Codemirror.
    import { codemirror } from 'vue-codemirror';
    import 'codemirror/lib/codemirror.css';
    import 'codemirror/mode/javascript/javascript.js';
    import 'codemirror/theme/base16-dark.css';

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
            codemirror: codemirror,
            interactionHeader: interactionHeader,
            interactionInterfaceList: interactionInterfaceList,
        },
        data: () => {
        return {
            codemirror: {
                options: {
                    tabSize: 4,
                    mode: 'text/javascript',
                    theme: 'base16-dark',
                    lineNumbers: true,
                    line: true
                }
            }
        };
        },
        methods: {
            onCodeChange: function(value) {
                this.interaction.code = value
                this.$emit('input', this.interaction);
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
