<template>
  <div
    class="app-explorer-item low-contrast"
    :class="{ selected: selected }"
    @click="selectItem(id)"
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
      id: String,
      label: String,
      selected: Boolean
    },
    methods: {
      selectItem: function(id) {
          this.$emit('select', id);
      }
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .app-explorer-item
    order 1
    padding 5px 10px 5px 10px
    display flex
    flex-direction row
    cursor pointer
    overflow: hidden
    white-space: nowrap;
    &:hover
      color #ffffff
    &.selected
      background-color layerThreeSecondaryColor
      color yellowAccentColor

  .icon
    height 1em
    width 1em
    margin-top: 0px
    
  .label
    margin-left 5px
    font-size 1em
    margin-top 0.05em

</style>
