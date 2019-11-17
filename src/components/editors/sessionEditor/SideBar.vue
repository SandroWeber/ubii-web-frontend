<template>
    <div class="side-bar">
        <div class="side-bar-top">
            Session: {{session.name}}<br/>
            Interactions: {{session.interactions.length}}
        </div>
        <side-bar-item v-for="interaction in session.interactions"
                       :selected="isSelected(interaction)"
                       :key="interaction.id"
                       :id="interaction.id"
                       :label="interaction.label"
                       @select="select(interaction)"></side-bar-item>
    </div>
</template>

<script>
  import SideBarItem from './SideBarItem';

  export default {
    name: 'SideBar',
    components: { SideBarItem },
    props: {
      session: {
        type: Object,
        required: true
      },
      selected: {
        type: Number,
      }
    },
    methods: {
      isSelected: function(interaction){
        return interaction.id === this.$props.selected;
      },
      select: function(interaction) {
        this.$props.selected = interaction.id;
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
        font-size: 1.2em;
    }

    .side-bar-top {
        padding: 0.5em 1em 0.5em 1em;
        line-height: 1.4em;
    }
</style>