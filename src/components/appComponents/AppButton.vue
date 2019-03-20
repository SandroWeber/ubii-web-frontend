<template>
  <button 
    class="app-button"
    @click="onClick"
  >
    <slot> </slot>
  </button>
</template>

<script>
  export default { 
    name: 'AppButton',
    components: {},
    props: {},
    methods: {
      onClick: function(value) {
          this.$emit('click', value);
      }
    }
  } 
</script> 

<style scoped lang="stylus">
@import "./../../styles/main/color"

.app-button
    border: 1px solid mediumContrastColor
    color: mediumContrastColor
    background-color: layerOneSecondaryColor

    &.round
      border-radius: 999px

    // Contrast
    &.low-contrast
        color: lowContrastColor
        border-color: lowContrastColor
    &.medium-contrast
        color: mediumContrastColor
        border-color: mediumContrastColor
    &.high-contrast
        color: highContrastColor
        border-color: highContrastColor
    &.max-contrast
        color: maxContrastColor
        border-color: maxContrastColor

    // Accents:
    &.red-accent
        color: redAccentColor
        border-color: redAccentColor
    &.green-accent
        color: greenAccentColor
        border-color: greenAccentColor
    &.yellow-accent
        color: yellowAccentColor
        border-color: yellowAccentColor
    &.orange-accent
        color: orangeAccentColor
        border-color: orangeAccentColor
    &.purple-accent
        color: purpleAccentColor
        border-color: purpleAccentColor
    &.blue-accent
        color: blueAccentColor
        border-color: blueAccentColor

    &:hover
        border-color: highContrastColor 
        color: highContrastColor
</style>