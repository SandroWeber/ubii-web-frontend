<template>
  <div>No content here</div>
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
      const width = container.clientWidth != 0 ? container.clientWidth : 500;
      const height = container.clientHeight != 0 ? container.clientHeight : 500;
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
      setTimeout(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const aspectRatio = width / height;

        this.renderer.setSize(width, height);
        this.camera.aspect = aspectRatio;
      }, 1000);
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

