<template>
  <div>No content here</div>
</template>

<script>
// Rendering
import * as THREE from "three";
import WebVR from "../sharedModules/WebVR";
import DefaultScene from "./modules/DefaultScene";

// Networking
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";

export default {
  name: "SAVRScene",

  mounted() {
    this.initScene();
    this.loadResources(); // defined in children
    this.connect();
    this.startGameLoop();
  },

  data() {
    return {
      camera: undefined,
      renderer: undefined,
      time: 0,
      clock: new THREE.Clock(),
      ubiiClientService: UbiiClientService,
      clients: new Map(),
      pollSmartDevices: false
    };
  },

  beforeDestroy: function() {
    this.stopPolling();
  },

  methods: {
    // RENDERING
    initScene: function() {
      let container = document.getElementById("savr-render-container");

      this.scene = new THREE.Scene();

      // setup default scene
      let defaultScene = new DefaultScene(
        this.scene,
        container.clientWidth / container.clientHeight
      );
      this.camera = defaultScene.camera;

      // finialize: create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoClear: false
      });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);

      container.appendChild(WebVR.createButton(this.renderer));
      this.renderer.vr.enabled = true;
    },
    // handles initialization of and in the render loop
    startGameLoop: function() {
      const ctx = this;

      this.renderer.setAnimationLoop(function() {
        let delta = ctx.clock.getDelta();
        ctx.time += delta;

        ctx.gameLoop(delta); // defined in children

        ctx.renderer.clear();
        ctx.renderer.render(ctx.scene, ctx.camera);
      });
    },

    // UBI INTERACT
    connect: function() {
      window.addEventListener("beforeunload", () => {
        this.stopPolling(); // unsubscribe before page is unloaded
      });

      this.pollSmartDevices = true;
      UbiiClientService.isConnected().then(() => {
        this.updateSmartDevices();
      });
    },

    stopPolling: function() {
      this.pollSmartDevices = false;
    }
  }
};
</script>

