<template>
  <div>Error loading scene. See console.</div>
</template>

<script>
// Rendering
import * as THREE from "three";
import WebVR from "../sharedModules/WebVR";
import DefaultSetup from "./modules/DefaultSetup";
import Stats from "../sharedModules/Stats";

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
      pollSmartDevices: false,
      container: undefined,
      stats: undefined
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
    },
    addEventListeners: function() {
      window.addEventListener("beforeunload", () => {
        this.onExit();
      });

      window.addEventListener("resize", () => {
        this.handleResize();
      });
    },

    // RENDERING
    initScene: function() {
      const ctx = this;

      const container = (this.container = document.getElementById(
        "savr-render-container"
      ));
      const width = container.clientWidth ? container.clientWidth : 500;
      const height = container.clientHeight ? container.clientHeight : 500;
      const aspectRatio = width / height;

      ctx.scene = new THREE.Scene();

      // setup default scene
      const defaultSetup = new DefaultSetup(ctx.scene, aspectRatio);
      ctx.scene.add(defaultSetup);
      ctx.camera = defaultSetup.camera;

      // finialize: create renderer
      ctx.renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoClear: false
      });
      ctx.renderer.setSize(width, height);
      container.appendChild(ctx.renderer.domElement);

      container.appendChild(WebVR.createButton(ctx.renderer));
      ctx.renderer.vr.enabled = ctx;

      // performance counter
      this.stats = new Stats();
      this.stats.showPanel(0);
      container.appendChild(this.stats.dom);

      this.onStart(); // defined in children
      this.startGameLoop();

      // workaround: https://github.com/vuejs/Discussion/issues/394
      //const ctx = this;
      const fixClientSize = () => {
        setTimeout(() => {
          if (!container || container.clientWidth == 0) {
            fixClientSize();
          } else {
            this.handleResize();
          }
        }, 500);
      };
      fixClientSize();
    },
    handleResize: function() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const aspectRatio = width / height;

      // eslint-disable-next-line no-console
      console.log("Viewport: " + width + " x " + height);

      this.camera.aspect = aspectRatio;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    },
    // handles initialization of and in the render loop
    startGameLoop: function() {
      const ctx = this;

      this.renderer.setAnimationLoop(function() {
        ctx.stats.begin();

        let delta = ctx.clock.getDelta();
        ctx.time += delta;

        ctx.updateGameLoop(delta); // defined in children

        ctx.renderer.clear();
        ctx.renderer.render(ctx.scene, ctx.camera);

        ctx.stats.end();
      });
    },

    // UBI INTERACT
    connect: function() {
      this.pollSmartDevices = true;

      UbiiClientService.isConnected().then(() => {
        const loop = () => {
          if (this.pollSmartDevices) {
            if (this.updateSmartDevices) {
              this.updateSmartDevices();
              setTimeout(loop, 1000);
            } else {
              // eslint-disable-next-line no-console
              console.warn(
                "Child component not loaded, but already updating device."
              );

              if (process.env.NODE_ENV === "development") {
                // really stupid fix, to fix hot-reloading
                // without this, for some reason the child component won't load and you would just see the template of this component
                // to still reload the view, we force-reload the whole page which is absolutely stupid
                // this should only ever happend during development, after a hot-reload; if not, remove this fix
                location.reload();
              }
            }
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

