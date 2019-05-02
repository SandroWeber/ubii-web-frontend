<template>
  <input
    class="app-input"
    :class="size"
    :id="id" 
    :type="type"
    v-model="localValue"
  />
</template>

<script>
  export default {
    name: 'AppInput',
    props: [
      'value',
      'id',
      'type',
      'size'
    ],
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
    border-radius: layerBorderRadius
  &.huge
    font-size 1.3em
  &.layer-one
    background-color: layerOneSecondaryColor
  &.layer-two
    background-color: layerTwoSecondaryColor
  &.layer-three
    background-color: layerThreeSecondaryColor
  &.layer-four
    background-color: layerFourSecondaryColor
</style>
