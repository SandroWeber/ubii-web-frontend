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
  .app-tile
    border-width: 2px
    border-style: solid
    text-decoration: none
    color: mediumContrastColor
    padding: 10px
    
    // Priamry
    &.layer-one
        border-color: layerOneBorderColor
    &.layer-two
        border-color: layerTwoBorderColor
    &.layer-three
        border-color: layerThreeBorderColor
    &.layer-four
        border-color: layerFourBorderColor

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
</style>
