<template>
    <app-layer class="interaction-mirror layer-three background shadow">  
        <div class="interaction-mirror-header high-contrast">
            <h3 class="medium-contrast id-title">
            id: {{interaction.id}}
            </h3>
            <app-input
                class="layer-one round title-input"
                :id="'interaction-name'" 
                :type="'type'"
                v-model="interaction.name"
                :size="'huge'"
            />
        </div>
        
        <h4 class="medium-contrast">
            inputFormats
        </h4>
        <div class="interface-code-wrapper layer-three border round">
            <source-code-mirror
                v-model="inputFormats"
                @input="onCodeChange"
            >
            </source-code-mirror>
        </div>
        
        
        <h4 class="medium-contrast">
            processingCallback
        </h4>
        <interaction-mirror-interface-list :interface-list="interaction.inputFormats"/>
        <div class="code-wrapper layer-three border round">
            <source-code-mirror
                v-model="interaction.processingCallback"
                @input="onCodeChange"
            >
            </source-code-mirror>
        </div>
        <interaction-mirror-interface-list :interfaceList="interaction.outputFormats"/>
        
        <h4 class="medium-contrast">
            outputFormats
        </h4>
        <div class="interface-code-wrapper layer-three border round">
            <source-code-mirror
                v-model="outputFormats"
                @input="onCodeChange"
            >
            </source-code-mirror>
        </div>
        
    </app-layer>
</template>

<script>
    import InteractionMirrorInterfaceList from './InteractionMirrorInterfaceList.vue';
    import SourceCodeMirror from './../sourceCodeMirror/SourceCodeMirror.vue';
    import { AppLayer , AppInput} from './../../appComponents/appComponents.js';
 
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
            SourceCodeMirror,
            InteractionMirrorInterfaceList,
            AppLayer,
            AppInput
        },
        data: () => {
            return {
            };
        },
        methods: {
            onCodeChange: function() {
                this.$emit('changes', this.interaction);
            }
        },
        computed: {
            inputFormats: {
                get() {
                    var inputString = JSON.stringify(this.interaction.inputFormats);
                    inputString = inputString.replace(/[,]/g, ",\n")
                        //.replace(/[\[]/g, "[\n")
                        //.replace(/[\]]/g, "\n]")
                        .replace(/[{]/g, "{\n")
                        .replace(/[}]/g, "\n}");
                    return inputString;
                },
                set(inputFormatsString) {
                    inputFormatsString = inputFormatsString.replace(/[\n]/g, "");
                    this.interaction.inputFormats = JSON.parse(inputFormatsString);
                    this.$emit('changes', this.interaction);
                }
            },
            outputFormats: {
                get() {
                    var outputString = JSON.stringify(this.interaction.outputFormats);
                    outputString = outputString.replace(/[,]/g, ",\n")
                        //.replace(/[\[]/g, "[\n")
                        //.replace(/[\]]/g, "\n]")
                        .replace(/[{]/g, "{\n")
                        .replace(/[}]/g, "\n}");
                    return outputString;
                },
                set(outputFormatsString) {
                    outputFormatsString = outputFormatsString.replace(/[\n]/g, "");
                    this.interaction.outputFormats = JSON.parse(outputFormatsString);
                    this.$emit('changes', this.interaction);
                }
            }
        }
    }
</script>

<style scoped lang="stylus">
    .interaction-mirror
        height 100%
        padding: 20px
        flex-grow: 1
        display: flex
        flex-direction: column
    
    .interaction-mirror-header
        display flex
        flex-direction row-reverse

    .code-wrapper
        text-align: left
        flex-grow: 2
        margin-top 10px
        margin-bottom 10px
    
    .id-title
        font-size 1.3em
        font-weight 600
        padding-top: 5px
        margin-left: 25px

    .title-input
        flex-grow: 1
    
    h4
        margin-top:20px
        margin-bottom 10px
    
</style>
