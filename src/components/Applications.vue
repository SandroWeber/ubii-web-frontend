<template>
  <div class="wrapper-applications">
    <div class="category">
      <div class="seperator">
        <span class="label">Visualization</span>
      </div>
      <div class="menu-item-list">
        <router-link
          to="/applications/visualization/3d_pose_visualizer"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="cubes" class="menu-icon" />
            <p>3D Pose Visualizer</p>
          </app-tile>
        </router-link>
      </div>

      <div class="seperator">
        <span class="label">Tutorials, Learning Examples</span>
      </div>

      <div class="menu-item-list">
        <router-link
          to="/applications/examples/mouse-pointer"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="mouse-pointer" class="menu-icon" />
            <p>Mouse Demo</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/threejs"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="cube" class="menu-icon" />
            <p>Three.js Web Rendering</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/threejs-webvr"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="vr-cardboard" class="menu-icon" />
            <p>Three.js WebVR Rendering</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/aframe"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="vr-cardboard" class="menu-icon" />
            <p>A-Frame</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/gatherer-web-interface-smart-devices"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="tablet-alt" class="menu-icon" />
            <p>Interface Smart Device Playground</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/model-viewer"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="cubes" class="menu-icon" />
            <p>Model Viewer</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/opencv"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="eye" class="menu-icon" />
            <p>OpenCV</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/examples/image-processing"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="camera" class="menu-icon" />
            <p>Image Processing</p>
          </app-tile>
        </router-link>
      </div>
    </div>
    <div class="category">
      <div class="seperator">
        <span class="label">Smartphone Assisted VR</span>
      </div>

      <div class="menu-item-list">
        <router-link
          to="/applications/smartphone-assisted-vr/savr-model-inspector"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="cubes" class="menu-icon" />
            <p>VR Model Inspector</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/smartphone-assisted-vr/savr-laser-pointer"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="hand-pointer" class="menu-icon" />
            <p>VR Laser Pointer</p>
          </app-tile>
        </router-link>

        <router-link
          to="/applications/smartphone-assisted-vr/savr-keyboard"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent menu-item-background">
            <font-awesome-icon icon="keyboard" class="menu-icon" />
            <p>VR Keyboard</p>
          </app-tile>
        </router-link>
      </div>
    </div>
    <div class="category">
      <div class="seperator">
        <span class="label">Misc</span>
      </div>

      <div class="menu-item-list">
        <router-link
          to="/applications/misc/rock-paper-scissors"
          class="menu-item"
          tag="div"
        >
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="hand-scissors" class="menu-icon" />
            <p>Rock Paper Scissors</p>
          </app-tile>
        </router-link>
      </div>

      <div class="menu-item-list"></div>
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
  faEye,
  faCamera
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
  faHandScissors,
  faEye,
  faCamera
);

export default {
  name: 'Applications',
  components: {
    AppTile
  }
};
</script>

<style scoped lang="stylus">

.wrapper-applications {
  overflow: auto;
  width: 100%;
}

.menu-item-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  margin: 10px;
}

.menu-item {
  width: 125px;
  height: 125px;
  text-align: center;
  cursor: pointer;
}

.menu-item-background {
  width: 100%;
  height: 100%;
}

.menu-icon {
  margin: 10px;
  width: 25px;
  height: 25px;
}

.category {
  .seperator {
    border-bottom: solid 1px highContrastColor;
    height: 10px;
    line-height: 20px;
    text-align: left;
    margin: 15px;

    .label {
      display: inline;
      padding-left: 15px;
      padding-right: 20px;
      background-color: layerOneSecondaryColor;
    }
  }
}
</style>
