<template>
  <div class="collapse-header">
    <button class="button-collapse" @click="toggleCollapse">
      <font-awesome-icon v-show="collapsed" icon="caret-right" class="interface-icon" />
      <font-awesome-icon v-show="!collapsed" icon="caret-down" class="interface-icon" />
    </button>
    <h3>{{title}}</h3>
  </div>
</template>

<script>
export default {
  name: 'AppCollapseButton',
  components: {},
  props: {
    title: {
      type: String,
      required: true,
      default: ''
    },
    targetID: {
      type: String,
      required: true,
      default: ''
    },
    collapsed: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  mounted: function() {
    this.targetElement = document.getElementById(this.targetID);
    this.targetElementDisplay = this.targetElement.style.display || 'block';
    this.setTargetElementVisibility();
  },
  methods: {
    toggleCollapse: function() {
      this.collapsed = !this.collapsed;
      this.setTargetElementVisibility();
    },
    setTargetElementVisibility: function() {
      if (this.collapsed) {
        this.targetElement.style.display = 'none';
      } else {
        this.targetElement.style.display = this.targetElementDisplay;
      }
    }
  }
};
</script> 

<style scoped lang="stylus">
@import "./../../styles/main/color"

.collapse-header 
  display: flex;
  flex-direction: row;
  align-items: center;
  
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

.button-collapse {
  width: 25px;
  height: 25px;
  margin-right: 20px;
  justify-content: center;
  align-items: center;
  border: 1px solid layerFourBorderColor;
  background-color: layerFourSecondaryColor;
  cursor: pointer;
}
</style>