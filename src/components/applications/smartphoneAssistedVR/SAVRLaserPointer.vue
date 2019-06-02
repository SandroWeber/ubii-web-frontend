<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
import UbiiClientContent from "../sharedModules/UbiiClientContent";
import SAVRScene from "./SAVRScene";

// Rendering
/* eslint-disable-next-line no-unused-vars */
import * as THREE from "three";
import { loadObj } from "./modules/threeHelper";
import { Vector3 } from "three";

export default {
  name: "SAVRLaserPointer",
  extends: SAVRScene,
  components: { UbiiClientContent },

  data() {
    return {
      model: undefined
    };
  },

  methods: {
    onStart: function() {
      const ctx = this;

      loadObj("models/smartphone", model => {
        model.scale.set(3, 3, 3);
        ctx.scene.add(model);
        ctx.model = model;
      });
    },
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(delta) {
      if (this.model && this.camera) {
        let camPos = this.camera.position;
        let viewDir = new THREE.Vector3(0, 0, -1);
        viewDir.applyQuaternion(this.camera.quaternion);
        viewDir.y = 0;
        this.model.position = new THREE.Vector3(camPos.x, 1.2, camPos.z).add(
          viewDir
        );
      }
    },
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
