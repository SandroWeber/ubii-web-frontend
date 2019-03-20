<template>
  <div class="app-layer">
    <slot> </slot>
  </div>
</template>

<script>
  export default { 
    name: 'AppLayer',
    components: {},
    props: {}
  } 
</script> 

<style scoped lang="stylus">
@import "./../../styles/main/color"

layerBorderWidth = 1px
layerBorderRadius = 5px

.app-layer
.layer-one
    z-index: 1000
    
    &.background
        background-color: layerOneSecondaryColor
    &.border
        border-width: layerBorderWidth
        border-style: solid
        border-color: layerOneBorderColor
        &.round
            border-radius: layerBorderRadius        

.layer-two
    z-index: 2000

    &.background
        background-color: layerTwoSecondaryColor
    &.border
        border-width: layerBorderWidth
        border-style: solid
        border-color: layerTwoBorderColor
        &.round
            border-radius: layerBorderRadius

.layer-three
    z-index: 3000

    &.background
        background-color: layerThreeSecondaryColor
    &.border
        border-width: layerBorderWidth
        border-style: solid
        border-color: layerThreeBorderColor
        &.round
            border-radius: layerBorderRadius

.layer-four
    z-index: 4000

    &.background
        background-color: layerFourSecondaryColor
    &.border
        border-width: layerBorderWidth
        border-style: solid
        border-color: layerFourBorderColor
        &.round
            border-radius: layerBorderRadius
</style>