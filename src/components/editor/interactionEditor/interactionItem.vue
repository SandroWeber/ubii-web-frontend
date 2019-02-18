<template>
  <div class="interaction-item low-contrast" @click="selectItem(id)" v-bind:class="{ selected: selected }">
    <font-awesome-icon icon="code" class="icon"/>
    <span class="label">{{name}}</span>
  </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faCode } from '@fortawesome/free-solid-svg-icons'
  library.add(faCode);

  export default { 
    name: 'interactionInterfaceToken',
    components: {},
    props: {
        id: String,
        name: String,
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
  .interaction-item
    height 20px
    order 1
    margin 5px
    padding 0px 10px 0px 10px
    display flex
    flex-direction row
    cursor pointer
    &:hover
      color #ffffff
    &.selected
      background-color layerThreeSecondaryColor
      color yellowAccentColor

  .icon
    height 16px
    width 16px
    margin-top: 1px
    
  .label
    margin-left 5px
</style>
