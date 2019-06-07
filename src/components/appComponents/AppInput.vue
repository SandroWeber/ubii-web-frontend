<template>
  <input
    class="app-input"
    :class="size"
    :id="id" 
    :type="type"
    :placeholder="placeholder"
    v-model="localValue"
  />
</template>

<script>
  export default {
    name: 'AppInput',
    props: {
      value: {
        type: String,
        required: true,
        },
      id: {
        type: String,
        required: true,
        },
      type: {
        type: String,
        required: false,
        default: "type"
        },
      size: {
        type: String,
        required: false,
        default: ""
        },
      placeholder: {
        type: String,
        required: false,
        default: ""
        }
    },
    computed: {
      localValue: {
        get() {
          return this.value
        },
        set(localValue) {
          this.$emit('input', localValue)
        }
      }
    },
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"

.app-input
  z-index: 4000
  padding-left 3px
  color: highContrastColor
  background-color: layerFourSecondaryColor
  border-width: 1px
  border-style: solid
  border-color: layerFourBorderColor
  &.round
    border-radius: 5px
  &.huge
    font-size 1.3em
  &.layer-one
    background-color: layerOneSecondaryColor
    border-color: layerOneBorderColor
  &.layer-two
    background-color: layerTwoSecondaryColor
    border-color: layerTwoBorderColor
  &.layer-three
    background-color: layerThreeSecondaryColor
    border-color: layerThreeBorderColor
  &.layer-four
    background-color: layerFourSecondaryColor
    border-color: layerFourBorderColor
  &.low-contrast-border
    border-color: lowContrastColor
  &.yellow-border
    border-color: yellowAccentColor
  &.low-contrast
    color: lowContrastColor
  &.yellow-accent
    color: yellowAccentColor
</style>
