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
                v-model="nameSource"
                :size="'huge'"
            />
        </div>
        
        <h4 class="medium-contrast">
            inputFormats
        </h4>
        <div class="interface-code-wrapper layer-three border round">
            <source-code-mirror
                v-model="inputFormatSource"
            >
            </source-code-mirror>
        </div>
        
        
        <h4 class="medium-contrast">
            processingCallback
        </h4>
        <interaction-mirror-interface-list
            :interface-list="interaction.inputFormat.interpreted"
            :interface-key="'input'"
            :code="processingCallbackSource"
        />
        <div class="code-wrapper layer-three border round">
            <source-code-mirror
                v-model="processingCallbackSource"
            >
            </source-code-mirror>
        </div>
         <interaction-mirror-interface-list
            :interfaceList="interaction.outputFormat.interpreted"
            :interface-key="'output'"
            :code="processingCallbackSource"
        />
        
        <h4 class="medium-contrast">
            outputFormats
        </h4>
        <div class="interface-code-wrapper layer-three border round">
            <source-code-mirror
                v-model="outputFormatSource"
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
            value: Object
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
                this.$emit('input', this.interaction);
            }
        },
        mounted: function () {
            this.inputFormatSource = this.interaction.inputFormat.source;
            this.outputFormatSource = this.interaction.outputFormat.source;
        },
        computed: {
            interaction: function(){
                return this.value;
            },
            nameSource: {
                get() {
                    return this.interaction.name;
                },
                set(value) {
                    this.interaction.name = value;

                    this.$emit('input', this.interaction);
                }
            },
            processingCallbackSource: {
                get() {
                    return this.interaction.processingCallback;
                },
                set(value) {
                    this.interaction.processingCallback = value;

                    this.$emit('input', this.interaction);
                }
            },
            inputFormatSource: {
                get() {
                    return this.interaction.inputFormat.source;
                },
                set(value) {
                    this.interaction.inputFormat.source = value;
                    try{
                       this.interaction.inputFormat.interpreted = JSON.parse(value);
                    } catch {
                        // eslint-disable-next-line
                        console.log("Invalid input format string.");
                    }
                    
                    this.$emit('input', this.interaction);
                }
            },
            outputFormatSource: {
                get() {
                    return this.interaction.outputFormat.source;
                },
                set(value) {
                    this.interaction.outputFormat.source = value;
                    try{
                       this.interaction.outputFormat.interpreted = JSON.parse(value);
                    } catch {
                        // eslint-disable-next-line
                        console.log("Invalid output format string.");
                    }
                    
                    this.$emit('input', this.interaction);
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
        font-weight 500
    
</style>
