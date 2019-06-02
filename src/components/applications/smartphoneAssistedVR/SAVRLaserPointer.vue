<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
import UbiiClientContent from "../sharedModules/UbiiClientContent";
import SAVRScene from "./SAVRScene";

// Rendering
import * as THREE from "three";
import { loadObj } from "./modules/threeHelper";

export default {
  name: "SAVRLaserPointer",
  extends: SAVRScene,
  components: { UbiiClientContent },

  data() {
    return {
      modelPrefab: undefined
    };
  },

  methods: {
    onStart: function() {
      const ctx = this;

      loadObj("models/smartphone", model => {
        ctx.modelPrefab = model;
        ctx.modelPrefab.position.set(0, 1.6, -0.75);
        ctx.modelPrefab.scale.set(3, 3, 3);
        ctx.scene.add(ctx.modelPrefab);
      });
    },
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
