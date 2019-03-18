<template>
  <div class="app-tile">
    <slot> </slot>
  </div>
</template>

<script>
  export default { 
    name: 'AppTile',
    components: {},
    props: {}
  } 
</script> 

<style scoped lang="stylus">
@import "./../../styles/main/base/color"

.app-tile
    border-width: 2px
    border-style: solid
    text-decoration: none
    color: mediumContrastColor
    padding: 10px
    
    // Priamry
    &.layer-one
        border-color: layerOneBorderColor
        background-color: layerOneSecondaryColor
    &.layer-two
        border-color: layerTwoBorderColor
        background-color: layerTwoSecondaryColor
    &.layer-three
        border-color: layerThreeBorderColor
        background-color: layerThreeSecondaryColor
    &.layer-four
        border-color: layerFourBorderColor
        background-color: layerFourSecondaryColor

    // Contrast
    &.low-contrast
        color: lowContrastColor
    &.medium-contrast
        color: mediumContrastColor
    &.high-contrast
        color: highContrastColor
    &.max-contrast
        color: maxContrastColor

    // Accents:
    &.red-accent
        color: redAccentColor
    &.green-accent
        color: greenAccentColor
    &.yellow-accent
        color: yellowAccentColor
    &.orange-accent
        color: orangeAccentColor
    &.purple-accent
        color: purpleAccentColor
    &.blue-accent
        color: blueAccentColor
    
    &:hover
      color: maxContrastColor

    & p 
        text-decoration-line: none !important
a
    text-decoration-line: none !important
</style>
