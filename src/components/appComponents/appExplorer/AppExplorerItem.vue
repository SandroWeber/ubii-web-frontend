<template>
  <div
    class="app-explorer-item low-contrast"
    :class="{ selected: selected }"
    @click.exact="select()"
    @click.ctrl.exact="selectCtrl()"
    @click.shift.exact="selectShift()"
  >
    <font-awesome-icon 
      icon="code"
      class="icon"
    />
    <span 
      class="label"
    >
      {{label}}
    </span>
  </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faCode } from '@fortawesome/free-solid-svg-icons'
  library.add(faCode);

  export default { 
    name: 'AppExplorerItem',
    components: {},
    props: {
      id: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      selected: {
        type: Boolean,
        required: true,
      },
      editable: {
        type: Boolean,
        required: false
      }
    },
    methods: {
      select: function() {
          this.$emit('select');
      },
      selectCtrl: function() {
          this.$emit('select-ctrl');
      },
      selectShift: function() {
          this.$emit('select-shift');
      }
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .app-explorer-item
    display flex
    cursor pointer
    flex-grow 0
    flex-shrink 0
    flex-basis 1.8em
    flex-direction row
    align-items center
    white-space nowrap;
    order 1
    padding 0px 0.5em 0px 0.5em
    overflow hidden
    &:hover
      color #ffffff
    &.selected
      background-color layerThreeSecondaryColor
      color yellowAccentColor

  .icon
    height 1em
    width 1em
    margin-top 0em
    
  .label
    margin-left 0.5em
    font-size 1em
    margin-top 0.05em
    user-select none
</style>
