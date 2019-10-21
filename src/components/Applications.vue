<template>
  <div>
    <div class="category">
      <div class="seperator">
        <span class="label">Visualization</span>
      </div>
      <div class="grid">
        <router-link
          to="/applications/visualization/3d_pose_visualizer"
          class="interface-link"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="cubes" class="interface-icon" />
            <p>3D Pose Visualizer</p>
          </app-tile>
        </router-link>
      </div>

      <div class="seperator">
        <span class="label">Tutorials, Learning Examples</span>
      </div>

      <div class="grid">
        <router-link to="/applications/examples/mouse-pointer" class="interface-link" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="mouse-pointer" class="interface-icon" />
            <p>Mouse Demo</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/examples/threejs" class="interface-link" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="cube" class="interface-icon" />
            <p>Three.js Web Rendering</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/examples/threejs-webvr" class="interface-link" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="vr-cardboard" class="interface-icon" />
            <p>Three.js WebVR Rendering</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/examples/aframe" class="interface-link" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="vr-cardboard" class="interface-icon" />
            <p>A-Frame</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/gatherer-web-interface-smart-devices"
          class="interface-link"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="tablet-alt" class="interface-icon" />
            <p>Gatherer - Interface Smart Devices</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/examples/opencv" class="interface-link" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="eye" class="interface-icon" />
            <p>OpenCV</p>
          </app-tile>
        </router-link>
      </div>
    </div>
    <div class="category">
      <div class="seperator">
        <span class="label">Smartphone Assisted VR</span>
      </div>

      <div class="grid">
        <router-link
          to="/applications/smartphone-assisted-vr/savr-model-inspector"
          class="interface-link"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="cubes" class="interface-icon" />
            <p>VR Model Inspector</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/smartphone-assisted-vr/savr-laser-pointer"
          class="interface-link"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="hand-pointer" class="interface-icon" />
            <p>VR Laser Pointer</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/smartphone-assisted-vr/savr-keyboard"
          class="interface-link"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="keyboard" class="interface-icon" />
            <p>VR Keyboard</p>
          </app-tile>
        </router-link>
      </div>
    </div>
    <div class="category">
      <div class="seperator">
        <span class="label">Misc</span>
      </div>

      <div class="grid">
        <router-link to="/applications/misc/rock-paper-scissors" class="interface-link" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="hand-scissors" class="interface-icon" />
            <p>Rock Paper Scissors</p>
          </app-tile>
        </router-link>
      </div>

      <div class="grid"></div>
    </div>
  </div>
</template>

<script>
import { AppTile } from './appComponents/appComponents.js';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faMousePointer,
  faCube,
  faCubes,
  faVrCardboard,
  faMobileAlt,
  faTabletAlt,
  faKeyboard,
  faHandPointer,
  faHandScissors,
  faEye
} from '@fortawesome/free-solid-svg-icons';
library.add(
  faMousePointer,
  faCube,
  faCubes,
  faVrCardboard,
  faMobileAlt,
  faTabletAlt,
  faKeyboard,
  faHandPointer,
  faEye,
  faHandScissors
);

export default {
  name: 'Applications',
  components: {
    AppTile
  }
};
</script>

<style scoped lang="stylus">
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin: 25px;
}

.interface-link {
  text-align: center;
  cursor: pointer;
}

.interface-icon {
  width: 50px;
  height: 50px;
}

.category {
  .seperator {
    border-bottom: solid 1px highContrastColor;
    height: 10px;
    line-height: 20px;
    text-align: left;

    .label {
      display: inline;
      padding-left: 15px;
      padding-right: 20px;
      background-color: layerOneSecondaryColor;
    }
  }
}
</style>
