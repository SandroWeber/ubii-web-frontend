<template>
  <div>Error loading scene. See console.</div>
</template>

<script>
// Rendering
import * as THREE from "three";
import WebVR from "../sharedModules/WebVR";
import DefaultSetup from "./modules/DefaultSetup";
import Stats from "../sharedModules/Stats";
import * as dat from "dat.gui";

// Networking
import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";
import UbiiEventBus from "../../../services/ubiiClient/ubiiEventBus";

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
      stats: undefined,
      gui: undefined
    };
  },

  mounted: function() {
    this.componentLoaded();
  },

  beforeDestroy: function() {
    this.onExit();
  },

  computed: {
    isDevelopment: function() {
      return process.env.NODE_ENV === "development";
    }
  },

  methods: {
    // INITIALIZATION
    componentLoaded: function() {
      this.registerEvents();

      this.initScene();

      if (UbiiClientService.isConnected) {
        this.onConnectToUbii();
      }
    },
    registerEvents: function() {
      window.addEventListener("beforeunload", () => {
        this.onExit();
      });

      window.addEventListener("resize", () => {
        this.handleResize();
      });

      UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
        this.onConnectToUbii();
      });
      UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, () => {
        this.onDisconnectToUbii();
      });
    },

    // RENDERING
    initScene: function() {
      const container = (this.container = document.getElementById(
        "savr-render-container"
      ));
      const width = container.clientWidth ? container.clientWidth : 500;
      const height = container.clientHeight ? container.clientHeight : 500;
      const aspectRatio = width / height;

      this.scene = new THREE.Scene();

      // setup default scene
      const defaultSetup = new DefaultSetup(this.scene, aspectRatio);
      this.scene.add(defaultSetup);
      this.camera = defaultSetup.camera;

      // create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        autoClear: false
      });
      this.renderer.setSize(width, height);
      container.appendChild(this.renderer.domElement);

      container.appendChild(WebVR.createButton(this.renderer));
      this.renderer.vr.enabled = true;

      // performance counter
      if (this.isDevelopment) {
        this.stats = new Stats();
        this.stats.showPanel(0);
        container.appendChild(this.stats.dom);
      }

      // gui
      this.gui = new dat.GUI({ autoPlace: false });
      let guiContainer = document.createElement("div");
      guiContainer.style.cssText = "position: fixed; bottom: 0; right: 0;";
      container.appendChild(guiContainer);
      guiContainer.appendChild(this.gui.domElement);

      // start logic
      this.onStart(); // defined in children
      this.startGameLoop();

      // workaround: https://github.com/vuejs/Discussion/issues/394
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
      console.info("Viewport: " + width + " x " + height);

      this.camera.aspect = aspectRatio;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    },
    // handles initialization of and in the render loop
    startGameLoop: function() {
      const ctx = this;

      this.renderer.setAnimationLoop(function() {
        if (ctx.stats) ctx.stats.begin();

        let delta = ctx.clock.getDelta();
        ctx.time += delta;

        ctx.updateGameLoop(delta); // defined in children

        ctx.renderer.clear();
        ctx.renderer.render(ctx.scene, ctx.camera);

        if (ctx.stats) ctx.stats.end();
      });
    },

    // UBI INTERACT
    startPollLoop: function() {
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

              if (this.isDevelopment) {
                // really stupid workaround, to fix hot-reloading
                // without this, for some reason the child component won't load and you would just see the template of this component
                // to reload the view, we force-reload the whole page which is absolutely stupid
                // this should only ever happend during development, after a hot-reload
                location.reload();
              }
            }
          }
        };
        loop();
      });
    },
    onConnectToUbii: function() {
      this.startPollLoop();
    },
    onDisconnectToUbii: function() {
      this.pollSmartDevices = false;
    },

    onExit: function() {
      if (this.renderer) {
        this.renderer.vr.enabled = false;
        //this.renderer.setAnimationLoop(null); produces error, but shouldn't as it says in the docs
        this.renderer.dispose();
      }
      this.onDisconnectToUbii();
    }
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
