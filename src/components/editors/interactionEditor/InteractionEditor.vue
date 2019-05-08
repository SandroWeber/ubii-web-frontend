<template>
  <div>
    <div class="interaction-editor layer-one background">
      <interaction-explorer
        class="interaction-explorer-instance"
        :interactions="interactions"
        @select="onSelectInteractions"
      />
      <interaction-mirror    
        v-model="selectedInteraction"
      />
    </div>
  </div>
</template>

<script>
  import InteractionExplorer from './../../explorers/interactionExplorer/InteractionExplorer.vue';
  import InteractionMirror from './../../mirrors/interactionMirror/InteractionMirror.vue';
  import { mapGetters, mapState, mapActions } from 'vuex'

  export default {
    name: 'InteractionEditor',
    props: {},
    components: {
      InteractionExplorer: InteractionExplorer,
      InteractionMirror: InteractionMirror
    },
    data: () => {
      return {
        selectedInteractions: [],
      };
    },
    computed: {
      selectedInteraction: {
        get: function () {
          if(this.selectedInteractions.length > 0){
            return this.selectedInteractions[0].data.interaction;
          }else{
            return {}
          }
          
          let id = this.selectedInteractionId;
          let index = this.interactions.findIndex(function(element) {
            return element.id === id;
          });

          if(index !== -1)
          {
            return this.interactions[index];
          }else{
            if(this.interactions.length > 0){
              return this.interactions[0];
            }else{
              return {};
            }
          }
        },
        set: function (newValue) {
          this.updateInteraction({
              interaction: newValue
            });
        }
      },
      ...mapGetters('interactions', {
        interactions: 'tree'
      }),
    },
    methods: {
        onSelectInteractions: function(payload) {
            this.selectedInteractions = payload.records; 
        },
        ...mapActions('interactions', {
            addInteraction: 'add',
            updateInteraction: 'update',
            pull: 'pull',
            startSynchronizationService: 'startSynchronizationService',
            stopSynchronizationService: 'stopSynchronizationService'
        }),
    },
    mounted: async function(){
        await this.pull();
        await this.startSynchronizationService();
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
        align-content flex-starts

    .interaction-explorer-instance
        width 300px
</style>
