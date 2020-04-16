<template>
  <div>
    <div class="interaction-editor layer-one background">
      <interaction-explorer
        class="interaction-explorer-instance"
        :interactions="interactions"
        @select="onSelectInteractions"
      />
      <interaction-mirror
        v-if="selectedInteraction !== undefined"
        v-model="selectedInteraction"
        :isEditable="selectedInteractionEditable"
      />
    </div>
  </div>
</template>

<script>
import InteractionExplorer from './../../explorers/interactionExplorer/InteractionExplorer.vue';
import InteractionMirror from './../../mirrors/interactionMirror/InteractionMirror.vue';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'InteractionEditor',
  components: {
    InteractionExplorer: InteractionExplorer,
    InteractionMirror: InteractionMirror
  },
  data: () => {
    return {
      selectedInteractions: []
    };
  },
  computed: {
    selectedInteraction: {
      get: function() {
        if (this.selectedInteractions.length > 0) {
          return this.selectedInteractions[0].data.interaction;
        } else {
          return undefined;
        }
      },
      set: function(newValue) {
        this.updateInteraction({
          interaction: newValue
        });
      }
    },
    selectedInteractionEditable: {
      get: function() {
        return this.selectedInteractions[0].editable;
      }
    },
    ...mapGetters('interactions', {
      interactions: 'tree'
    })
  },
  methods: {
    onSelectInteractions: function(payload) {
      this.selectedInteractions = payload.records;
    },
    ...mapActions('interactions', {
      pull: 'pull',
      updateInteraction: 'update',
      startSynchronizationService: 'startSynchronizationService',
      stopSynchronizationService: 'stopSynchronizationService'
    })
  },
  mounted: async function() {
    await this.pull();
    await this.startSynchronizationService();
  }
};
</script>

<style scoped lang="stylus">
.interaction-editor {
  height: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-starts;
}

.interaction-explorer-instance {
  width: 300px;
}
</style>
