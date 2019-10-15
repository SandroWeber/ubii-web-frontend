<template>
  <app-layer class="interaction-mirror layer-three background shadow">
    <div class="interaction-mirror-header high-contrast">
      <h3 class="medium-contrast id-title">id: {{interaction.id}}</h3>
      <app-input
        class="layer-one round title-input"
        :id="'interaction-name'"
        :type="'type'"
        v-model="nameSource"
        :size="'huge'"
      />
    </div>

    <div class="category">
      <app-collapse-section-header
        :title="'Details'"
        :targetID="'details-content'"
        :initiallyCollapsed="true"
        class="layer-three"
      />
      <div id="details-content">
        <div class="details-content">
          <!-- authors -->
          <div>Authors (separate via ";"):</div>
          <app-input
            class="layer-two round title-input"
            :id="'input-interaction-authors'"
            :type="'type'"
            v-model="authorsSource"
          />
          <!-- tags -->
          <div>Tags (separate via ";"):</div>
          <app-input
            class="layer-two round title-input"
            :id="'input-interaction-tags'"
            :type="'type'"
            v-model="tagsSource"
          />
          <!-- description -->
          <div>Description:</div>
          <app-input
            class="layer-two round title-input"
            :id="'input-interaction-description'"
            :type="'type'"
            v-model="descriptionSource"
          />
        </div>
      </div>
    </div>

    <div class="category">
      <app-collapse-section-header
        :title="'Callback: onCreated(state)'"
        :targetID="'oncreated-content'"
        class="layer-three"
      />
      <div id="oncreated-content" class="code-wrapper layer-three border round">
        <source-code-mirror v-model="onCreatedSource"></source-code-mirror>
      </div>
    </div>

    <div class="category">
      <app-collapse-section-header
        :title="'Callback: process(inputs, outputs, state)'"
        :targetID="'process-content'"
        class="layer-three"
      />
      <div id="process-content">
        <div class="segment">
          <h3>process frequency (Hz):</h3>
          <app-input
            class="process-frequency-input layer-two round title-input"
            :id="'input-interaction-processFrequency'"
            :type="'type'"
            v-model="processFrequencySource"
          />
        </div>

        <div class="code-wrapper layer-three round">
          <interaction-mirror-interface-list
            v-model="inputFormatSource"
            :interface-key="'inputs'"
            :code="processingCallbackSource"
          />
          <div class="code-wrapper layer-three border round">
            <source-code-mirror v-model="processingCallbackSource"></source-code-mirror>
          </div>
          <interaction-mirror-interface-list
            v-model="outputFormatSource"
            :interface-key="'outputs'"
            :code="processingCallbackSource"
          />
        </div>
      </div>
    </div>
  </app-layer>
</template>

<script>
import InteractionMirrorInterfaceList from './InteractionMirrorInterfaceList.vue';
import SourceCodeMirror from './../sourceCodeMirror/SourceCodeMirror.vue';
import {
  AppLayer,
  AppInput,
  AppCollapseSectionHeader
} from './../../appComponents/appComponents.js';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
library.add(faCaretDown, faCaretRight);

export default {
  name: 'InteractionMirror',
  props: {
    value: Object
  },
  components: {
    SourceCodeMirror,
    InteractionMirrorInterfaceList,
    AppLayer,
    AppInput,
    AppCollapseSectionHeader
  },
  data: () => {
    return {
      showDetails: false
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
    authorsSource: {
      get() {
        return this.interaction.authors.join(';');
      },
      set(value) {
        let raw = this.interaction;
        raw.authors = value.split(';');
        this.interaction = raw;
      }
    },
    tagsSource: {
      get() {
        return this.interaction.tags.join(';');
      },
      set(value) {
        let raw = this.interaction;
        raw.tags = value.split(';');
        this.interaction = raw;
      }
    },
    descriptionSource: {
      get() {
        return this.interaction.description;
      },
      set(value) {
        let raw = this.interaction;
        raw.description = value;
        this.interaction = raw;
      }
    },
    onCreatedSource: {
      get() {
        return this.interaction.onCreated;
      },
      set(value) {
        let raw = this.interaction;
        raw.onCreated = value;
        this.interaction = raw;
      }
    },
    processFrequencySource: {
      get() {
        return (
          (this.interaction.processFrequency &&
            this.interaction.processFrequency.toString()) ||
          NaN.toString()
        );
      },
      set(value) {
        let raw = this.interaction;
        raw.processFrequency = parseFloat(value);
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
};
</script>

<style scoped>
.interaction-mirror {
  height: 100%;
  overflow: scroll;
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.interaction-mirror-header {
  display: flex;
  flex-direction: row-reverse;
  margin-bottom: 2em;
}

.code-wrapper {
  text-align: left;
  flex-grow: 2;
  margin-top: 10px;
  margin-bottom: 10px;
}

.id-title {
  font-size: 1.3em;
  font-weight: 600;
  padding-top: 5px;
  margin-left: 25px;
}

.title-input {
  flex-grow: 1;
}

h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 500;
}

.category {
  border-top: 2px solid white;
  padding-top: 20px;
  padding-bottom: 20px;
}

.details-content {
  display: grid;
  grid-gap: 5px;
  grid-template-rows: 30px 30px;
  grid-template-columns: 200px auto;
  padding: 10px;
  align-items: center;
}

.segment {
  padding: 10px;
  display: flex;
  flex-direction: row;
}

.process-frequency-input {
  margin: 0px 20px 0px 20px;
}
</style>
