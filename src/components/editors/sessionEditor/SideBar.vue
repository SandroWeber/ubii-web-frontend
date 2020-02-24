<template>
    <div class="side-bar" id="side-bar">
        <div class="side-bar-top">
            Dataset: {{session.name}}<br/>
            Nodes: {{session.interactions.length}}
        </div>
        <side-bar-item :id="'0'" :title="'Datasets'" :desc="'Choose the dataset you want to display.'" :content="sessions">
            <list-item v-for="session in sessions"
                       :key="session.id" :id="session.id"
                       :selected="isSelected(session.id)"
                       :normal="true"
                       :list_item="2"
                       @select="select(session.id)"
                       @change="change('dataset', session.id)">
                <span><span>{{session.name}}</span><br/><span class="small">{{session.id}}</span></span>
            </list-item>
        </side-bar-item>
        <side-bar-item :id="'1'" :title="'Nodes in Dataset'"
                       :desc="'Choose a node on which you want to focus.'" :content="session.interactions">
            <list-item v-for="interaction in session.interactions"
                       :selected="isSelectedInteraction(interaction)"
                       :key="interaction.id"
                       :id="interaction.id"
                       :normal="true"
                       :list_item="1"
                       @select="selectInteraction(interaction)"
                       @change="change('viewNode', interaction)">{{interaction.name}}
            </list-item>
        </side-bar-item>
        <side-bar-item :id="'2'" :title="'Settings'" :desc="'Change various options about the visualization.'">
            <settings-container :settings="settings" :eventBus="eventBus" @change="change"></settings-container>
        </side-bar-item>
        <side-bar-item :id="'3'" :title="'Test-Datasets'"
                       :desc="'Choose a made-up dataset for testing.'" :content="scenarios">
            <list-item v-for="scenario in scenarios"
                       :selected="isSelected(scenario)"
                       :key="scenario.name"
                       :normal="false"
                       :list_item="0"
                       :id="scenario.id">{{scenario.name}}
                <button v-if="!isSelected(scenario)" class="button" @click.exact="change('dataset', scenario.id)">
                    Activate
                </button>
            </list-item>
        </side-bar-item>
    </div>
</template>

<script>
  import ListItem from './ListItem';
  import SideBarItem from './SideBarItem';
  import SettingsContainer from './SettingsContainer';

  export default {
    name: 'SideBar',
    components: { SettingsContainer, SideBarItem, ListItem },
    props: {
      selected: {
        type: String,
      },
      settings: {
        type: Object
      },
      selectedInteraction: {
        type: String
      },
      scenarios: {
        type: Array
      },
      sessions: {
        type: Array
      },
      eventBus: {
        type: Object
      }
    },
    watch: {
      sessions: function() {

      }
    },
    computed: {
      interaction: function() {
        return this.session.interactions[this.selectedInteraction];
      },
      session: function() {
        let search = this.$props.sessions.filter(el => el.id === this.$props.selected);
        if(search.length != 1) {
          return this.$props.scenarios.filter(el => el.id === this.$props.selected)[0].session;
        } else {
          return search[0];
        }
      }
    },
    methods: {
      isSelectedInteraction: function(interaction) {
        return interaction.id === this.$props.selectedInteraction;
      },
      isSelected: function(session) {
        return session.id == this.settings.dataset;
      },
      selectInteraction: function(interaction) {
        this.$emit('selectInteraction', interaction.id);
      },
      select: function(id) {
        this.$emit('select', id);
      },
      change: function(setting, value) {
        this.$emit('change', setting, value);
      }
    }
  };
</script>

<style scoped lang="stylus">
    .side-bar {
        height: 100%;
        background-color: #221F22;
        display: flex;
        flex-direction: column;
        border-right: 1px solid black;
        font-size: 1.0em;
    }

    .side-bar-top {
        padding: 0.5em 1em 0.5em 1em;
        line-height: 1.4em;
    }

    .button {
        margin-left: 15px;
        padding: 5px 10px;
        border: 1px solid white;
        color: white;
        letter-spacing 1px;
        border-radius: 4px;
        background: rgb(70, 143, 255);
        background: linear-gradient(66deg, rgba(70, 143, 255, 1) 0%, rgba(0, 100, 255, 1) 57%);
    }

    .title {
        display: block;
        display: flex;
        flex-direction: row;
    }

    .small {
        font-size: 0.8em;
        font-style: italic;
    }
</style>