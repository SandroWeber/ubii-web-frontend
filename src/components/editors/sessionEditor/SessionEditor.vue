<template>
    <div>
        <UbiiClientContent :ubiiClientService="ubiiClientService">
            <div class="session-editor">
                <side-bar
                        class="side-bar-instance"
                        :session="selectedSession"
                        :selected=selectedInteraction
                        @select="select"
                ></side-bar>
                <div class="main">
                    <top-bar class="top-bar-instance"></top-bar>

                    <graph-view></graph-view>
                </div>
            </div>
        </UbiiClientContent>
    </div>
</template>

<script>
  import TopBar from './TopBar.vue';
  import SideBar from './SideBar.vue';
  import GraphView from './GraphView.vue';

  import UbiiClientContent from '../../applications/sharedModules/UbiiClientContent';
  import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

  import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
  import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faPlay } from '@fortawesome/free-solid-svg-icons';

  library.add(faPlay);

  export default {
    name: 'SessionEditor',
    components: {
      TopBar: TopBar,
      SideBar: SideBar,
      GraphView: GraphView,
      UbiiClientContent
    },
    data: () => {
      return {
        selectedSession: {
          interactions: []
        },
        selectedInteraction: 0,
        ubiiClientService: UbiiClientService
      };
    },
    /* STEP 1: mounted() is our vue component entry point, start here! */
    mounted: function() {
      // unsubscribe before page is suddenly closed
      window.addEventListener('beforeunload', () => {
        this.stopEditor();
      });

      // some event hooks to restart/stop the experiment if necessary
      UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
        this.stopEditor();
        this.startEditor();
      });

      // make sure we're connected, then start the example
      UbiiClientService.isConnected().then(() => {
        this.startEditor();
      });

      UbiiClientService.onDisconnect(() => {
        this.stopEditor();
      });
    },
    beforeDestroy: function() {
      this.stopEditor();
    },
    methods: {
      select: function(id) {
        this.selectedInteraction = id;
      },
      startEditor: function() {
        // subscribe to session info topic
        UbiiClientService.subscribe(
          DEFAULT_TOPICS.INFO_TOPICS.NEW_SESSION,
          // a callback to be called when new data on this topic arrives
          sessionInfo => {
            this.update(sessionInfo);
          }
        );
      },
      stopEditor: async function() {
        if (!this.exampleStarted) return;

        this.exampleStarted = false;

        // unsubscribe and stop session
        UbiiClientService.unsubscribe(this.$data.outputServerPointer.topic);
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: this.$data.ubiiSession
        });

        if (this.$data.ubiiDevice) {
          await UbiiClientService.deregisterDevice(this.$data.ubiiDevice);
        }
      },
      update: function(session) {
        this.data.selectedSession = session;
      }
    }
  };
</script>

<style scoped lang="stylus">
    .main {
        flex-basis: 0;
        flex-grow: 999;
        box-shadow: -1px 1px 10px 0px #101010;
    }

    .session-editor {
        height: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        flex-wrap: wrap;
        align-items: stretch;
        align-content: flex-start;
    }

    .side-bar-instance {
        flex-basis: 300px;
    }

    .top-bar-instance {
        height: 200px;
    }
</style>
