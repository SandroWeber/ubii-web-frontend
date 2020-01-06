<template>
    <div class="side-bar" id="side-bar">
        <div class="side-bar-top">
            Session: {{session.name}}<br/>
            Interactions: {{session.interactions.length}}
        </div>
        <side-bar-item title="Interaction List"
                       :desc="'Choose an interaction on which you want to focus'">
            <list-item v-for="interaction in session.interactions"
                       :selected="isSelectedInteraction(interaction)"
                       :key="interaction.id"
                       :id="interaction.id"
                       :normal="true"
                       :list_item="1"
                       @select="select(interaction)">{{interaction.name}}
            </list-item>
        </side-bar-item>
        <side-bar-item title="Session Scenarios Testing"
                       :desc="'Choose a made-up scenario of chained interactions for testing'">
            <list-item v-for="scenario in scenarios"
                       :selected="isSelectedScenario(scenario)"
                       :key="scenario.name"
                       :normal="false"
                       :list_item="0"
                       :id="scenario.id">{{scenario.name}}:
                <button v-if="!isSelectedScenario(scenario)" class="button" @click.exact="selectScenario(scenario.id)">
                    Activate
                </button>
            </list-item>
        </side-bar-item>
    </div>
</template>

<script>
  import ListItem from './ListItem';
  import SideBarItem from './SideBarItem';

  export default {
    name: 'SideBar',
    components: { SideBarItem, ListItem },
    props: {
      selectedScenario: {
        type: Number
      },
      selectedInteraction: {
        type: String
      },
      scenarios: {
        type: Array
      }
    },
    computed: {
      interaction: function() {
        return this.scenarios[this.selectedScenario].session.interactions[this.selectedInteraction];
      },
      session: function() {
        return this.scenarios[this.selectedScenario].session;
      }
    },
    methods: {
      isSelectedInteraction: function(interaction) {
        return interaction.id === this.$props.selectedInteraction;
      },
      isSelectedScenario: function(scenario) {
        return scenario.id === this.$props.selectedScenario;
      },
      select: function(interaction) {
        this.$emit('select', interaction.id);
      },
      selectScenario: function(id) {
        this.$emit('selectScenario', id);
      }
    }
  };
</script>

<style scoped lang="stylus">
    .side-bar {
        height: 100%;
        background-color: #221F22;
        flex-grow: 1;
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
</style>