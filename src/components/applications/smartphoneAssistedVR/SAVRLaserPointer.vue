<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
import UbiiClientContent from "../sharedModules/UbiiClientContent";
import SAVRScene from "./SAVRScene";

export default {
  name: "SAVRLaserPointer",
  extends: SAVRScene,
  components: { UbiiClientContent },

  methods: {
    onStart: function() {},
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(delta) {},
    updateSmartDevices: function() {},
    onExit: function() {}
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
