<template>
  <div>Error loading view. See console.</div>
</template>

<script>
// Rendering
import * as THREE from "three";
import WebVR from "../sharedModules/WebVR";
import DefaultSetup from "./modules/DefaultSetup";

// Networking
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";

export default {
  name: "SAVRScene",

  data: function() {
    return {
      scene: undefined,
      camera: undefined,
      renderer: undefined,
      time: 0,
      clock: new THREE.Clock(),
      ubiiClientService: UbiiClientService,
      pollSmartDevices: false
    };
  },

  mounted: function() {
    this.componentLoaded();
  },

  beforeDestroy: function() {
    this.onExit();
  },

  methods: {
    // INITIALIZATION
    componentLoaded: function() {
      this.addEventListeners();
      this.connect();

      this.initScene();
      this.onStart(); // defined in children
      this.startGameLoop();
    },
    addEventListeners: function() {
      window.addEventListener("beforeunload", () => {
        this.onExit();
      });
    },

    // RENDERING
    initScene: function() {
      const container = document.getElementById("savr-render-container");
      let width = 500;
      if (container && container.clientWidth) {
        width = container.clientWidth;
      }
      let height = 500;
      if (container && container.clientHeight) {
        height = container.clientHeight;
      }
      const aspectRatio = width / height;

      this.scene = new THREE.Scene();

      // setup default scene
      const defaultSetup = new DefaultSetup(this.scene, aspectRatio);
      this.scene.add(defaultSetup);
      this.camera = defaultSetup.camera;

      // finialize: create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoClear: false
      });
      this.renderer.setSize(width, height);
      container.appendChild(this.renderer.domElement);

      container.appendChild(WebVR.createButton(this.renderer));
      this.renderer.vr.enabled = true;

      // workaround: https://github.com/vuejs/Discussion/issues/394
      const ctx = this;
      const fixClientSize = () => {
        setTimeout(() => {
          if (!container || container.clientWidth == 0) {
            fixClientSize();
          } else {
            const width = container.clientWidth;
            const height = container.clientHeight;
            const aspectRatio = width / height;

            console.log(height);

            ctx.renderer.setSize(width, height);
            ctx.camera.aspect = aspectRatio;
          }
        }, 500);
      };
      fixClientSize();
    },
    // handles initialization of and in the render loop
    startGameLoop: function() {
      const ctx = this;

      this.renderer.setAnimationLoop(function() {
        let delta = ctx.clock.getDelta();
        ctx.time += delta;

        ctx.updateGameLoop(delta); // defined in children

        ctx.renderer.clear();
        ctx.renderer.render(ctx.scene, ctx.camera);
      });
    },

    // UBI INTERACT
    connect: function() {
      this.pollSmartDevices = true;

      UbiiClientService.isConnected().then(() => {
        const loop = () => {
          if (this.pollSmartDevices) {
            this.updateSmartDevices();
            setTimeout(loop, 1000);
          }
        };
        loop();
      });
    },

    onExit: function() {
      this.pollSmartDevices = false;
    }
  }
};
</script>

