<template>
  <div class="app-token" :class="computedClassList">
    <span class="token-text">{{text}}</span>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'AppToken',
  components: {},
  props: {
    text: String,
    useFixedCornerRadius: Boolean
  },
  computed: {
    computedClassList: function() {
      return {
        'fixed-corner-radius': this.useFixedCornerRadius
      };
    }
  }
};
</script> 

<style scoped lang="stylus">
@import './../../styles/main/color';

.app-token {
  // Base:
  background-color: mediumContrastColor;
  border-radius: 999px;
  color: layerOneSecondaryColor;
  padding: 5px 10px 5px 10px;

  &.fixed-corner-radius {
    border-radius: 1em;
  }

  // Primary:
  &.layer-one {
    color: layerOneSecondaryColor;
  }

  &.layer-two {
    color: layerTwoSecondaryColor;
  }

  &.layer-three {
    color: layerThreeSecondaryColor;
  }

  &.layer-four {
    color: layerFourSecondaryColor;
  }

  // Contrasts
  &.low-contrast {
    background-color: lowContrastColor;
  }

  &.medium-contrast {
    background-color: mediumContrastColor;
  }

  &.high-contrast {
    background-color: highContrastColor;
  }

  &.max-contrast {
    background-color: maxContrastColor;
  }

  // Accents:
  &.red-accent {
    background-color: redAccentColor;
  }

  &.green-accent {
    background-color: greenAccentColor;
  }

  &.yellow-accent {
    background-color: yellowAccentColor;
  }

  &.orange-accent {
    background-color: orangeAccentColor;
  }

  &.purple-accent {
    background-color: purpleAccentColor;
  }

  &.blue-accent {
    background-color: blueAccentColor;
  }
}

.token-text {
  color: maxContrastColor;
}

.layer-one {
  & .token-text {
    color: layerOneSecondaryColor;
  }
}

.layer-two {
  & .token-text {
    color: layerTwoSecondaryColor;
  }
}

.layer-three {
  & .token-text {
    color: layerThreeSecondaryColor;
  }
}

.layer-four {
  & .token-text {
    color: layerFourSecondaryColor;
  }
}
</style>