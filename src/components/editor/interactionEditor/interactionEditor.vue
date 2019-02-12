<template>
    <div>
        <div class="interaction-editor layer-one background">
            <interaction-explorer :interactions="interactions" :selectedInteractionId="selectedInteractionId" @selectInteraction="onSelectInteraction"/>
            <interaction-mirror :interaction="selectedInteraction" v-model="onSelectedInteractionChange"/>
        </div>
    </div>
</template>

<script>
    import interactionExplorer from './interactionExplorer.vue';
    import interactionMirror from './interactionMirror.vue';

    // Dummy interaction.
    let dummyInteractions = [
        {
            id: '1234',
            name: 'Dummy Interaction One',
            code: '(input, output, state) => { return true; }',
            input: [
                {
                    name: 'input-A',
                    topic: 'topic-A'
                },
                {
                    name: 'input-B',
                    topic: 'topic-B'
                }
            ],
            output: [
                {
                    name: 'output-X',
                    topic: 'topic-X'
                },
                {
                    name: 'output-Y',
                    topic: 'topic-Y'
                }
            ]
        },
        {
            id: '5678',
            name: 'Dummy Interaction Two',
            code: '(input, output, state) => { return true; }',
            input: [
                {
                    name: 'Position A',
                    topic: 'topic-A'
                },
                {
                    name: 'Position B',
                    topic: 'topic-B'
                },
                {
                    name: 'Step',
                    topic: 'topic-C'
                }
            ],
            output: [
                {
                    name: 'Position',
                    topic: 'topic-X'
                },
                {
                    name: 'Progress',
                    topic: 'topic-Y'
                }
            ]
        },
        {
            id: '9123',
            name: 'Dummy Interaction Three',
            code: '(input, output, state) => { return true; }',
            input: [
                {
                    name: 'Position',
                    topic: 'topic-A'
                },
                {
                    name: 'Rotation',
                    topic: 'topic-B'
                },
                {
                    name: 'Scale',
                    topic: 'topic-C'
                }
            ],
            output: [
                {
                    name: 'Vertex X',
                    topic: 'topic-X'
                },
                {
                    name: 'Vertex Y',
                    topic: 'topic-Y'
                },
                {
                    name: 'Vertex Z',
                    topic: 'topic-Z'
                },
                {
                    name: 'Vertex W',
                    topic: 'topic-W'
                }
            ]
        }
    ];

    export default {
        name: 'interactionEditor',
        props: {},
        components: {
            interactionExplorer: interactionExplorer,
            interactionMirror: interactionMirror
        },
        data: () => {
            return {
                selectedInteractionId: 0,
                interactions: dummyInteractions,
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
        computed: {
            selectedInteraction: function (){
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
            }
        },
        methods: {
            onSelectInteraction: function(id) {
                this.selectedInteractionId = id;
            },
            onSelectedInteractionChange: function(input){
                this.selectedInteraction = input;
            }
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
        align-content flex-start

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
