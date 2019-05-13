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

    <interaction-mirror-interface-list
      v-model="inputFormatSource"
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
        v-model="outputFormatSource"
        :interface-key="'output'"
        :code="processingCallbackSource"
    />
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
    computed: {
      interaction: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value);
        }
      },
      nameSource: {
        get() {
          return this.interaction.name;
        },
        set(value) {
          let raw = this.interaction;
          raw.name = value;
          this.interaction = raw;
        }
      },
      processingCallbackSource: {
        get() {
          return this.interaction.processingCallback;
        },
        set(value) {
          let raw = this.interaction;
          raw.processingCallback = value;
          this.interaction = raw;
        }
      },
      inputFormatSource: {
        get() {
          return this.interaction.inputFormats;
        },
        set(value) {
          let raw = this.interaction;
          raw.inputFormats = value;
          this.interaction = raw;
        }
      },
      outputFormatSource: {
        get() {
          return this.interaction.outputFormats;
        },
        set(value) {
          let raw = this.interaction;
          raw.outputFormats = value;
          this.interaction = raw;
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
    margin-bottom: 2em

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
