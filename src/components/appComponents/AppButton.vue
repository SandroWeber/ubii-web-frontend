<template>
  <button 
    class="app-button"
    @click="onClick"
  >
    <div
      class="center"
      :style="{width: getSizeStyle, height: getSizeStyle}"
    >
      <slot> </slot>
    </div>
  </button>
</template>

<script>
  export default { 
    name: 'AppButton',
    components: {},
    props: {
      contentSizePercentage: Number
    },
    methods: {
      onClick: function(value) {
          this.$emit('click', value);
      }
    },
    computed:{
      getSizeStyle: function(){
        if(this.contentSizePercentage){
          return this.contentSizePercentage+"%";
        }else{
          return "100%";
        }
      }
    }
  } 
</script> 

<style scoped lang="stylus">
@import "./../../styles/main/color"

.app-button
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid mediumContrastColor
    color: mediumContrastColor
    background-color: layerOneSecondaryColor
    cursor pointer

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