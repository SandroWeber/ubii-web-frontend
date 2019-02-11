<template>
    <div>
        <div class="interaction-editor-wrapper">
        
            <interaction-header :name="interaction.name" :id="interaction.id"/>

            <div class="inout-wrapper">
                <div v-for="input in interaction.inputMappings" :key="input.name" class="inout-mapping">
                <span>{{input.topic}}</span>
                <br />
                <font-awesome-icon icon="arrow-down" />
                <br />
                <span>{{input.name}}</span>
                </div>
            </div>

            <div class="code-wrapper">
                <codemirror v-model="interaction.code" :options="codemirror.options"></codemirror>
            </div>

            <div class="inout-wrapper">
                <div v-for="output in interaction.outputMappings" :key="output.name" class="inout-mapping">
                <span>{{output.name}}</span>
                <br />
                <font-awesome-icon icon="arrow-down" />
                <br />
                <span>{{output.topic}}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import interactionHeader from './interactionHeader.vue';

    // Codemirror.
    import { codemirror } from 'vue-codemirror';
    import 'codemirror/lib/codemirror.css';
    import 'codemirror/mode/javascript/javascript.js';
    import 'codemirror/theme/base16-dark.css';

    // Fontawesome.
    import { library } from '@fortawesome/fontawesome-svg-core';
    import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
    library.add(faArrowDown);

    // Dummy interaction.
    let dummyInteraction = {
        id: '1234',
        name: 'Dummy Interaction',
        code: '(input, output, state) => { return true; }',
        inputMappings: [
            {
                name: 'input-A',
                topic: 'topic-A'
            },
            {
                name: 'input-B',
                topic: 'topic-B'
            }
        ],
        outputMappings: [
            {
                name: 'output-X',
                topic: 'topic-X'
            },
            {
                name: 'output-Y',
                topic: 'topic-Y'
            }
        ]
    };

    export default {
        name: 'interactionEditor',
        props: {},
        components: {
        codemirror,
        interactionHeader
        },
        data: () => {
        return {
            interaction: dummyInteraction,
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
        }
    }
</script>

<style scoped lang="stylus">
    .interaction-editor-wrapper {
        margin: 10px;
    }

    .code-wrapper {
        text-align: left;
        margin: 10px;
    }

    .inout-wrapper {
        display: flex;
        flex-direction: row;
    }

    .inout-mapping {
        margin: 5px;
        padding: 5px;
        color: cyan;
        background: black;
        text-align: center;
    }
</style>
