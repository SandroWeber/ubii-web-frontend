<template>
  <div class="wrapper-applications">
    <page-header />
    
    <div class="tile-menu-category">
      <!--<div class="tile-menu-category-seperator">
        <span class="tile-menu-category-seperator-label">Visualization</span>
      </div>

      <div class="tile-menu-list">
        <router-link to="/applications/visualization/3d_pose_visualizer" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="cubes" class="tile-menu-icon" />
            <p>3D Pose Visualizer</p>
          </app-tile>
        </router-link>
      </div>-->

      <div class="tile-menu-category-seperator">
        <span class="tile-menu-category-seperator-label">Tutorials, Learning Examples</span>
      </div>

      <div class="tile-menu-list">
        <router-link to="/applications/examples/mouse-pointer" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="mouse-pointer" class="tile-menu-icon" />
            <p>Mouse Demo</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/examples/random-walker" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="shoe-prints" class="tile-menu-icon" />
            <p>Random Walker (conditional pub/sub)</p>
          </app-tile>
        </router-link>

        <!--<router-link to="/applications/examples/gatherer-web-interface-smart-devices" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="tablet-alt" class="tile-menu-icon" />
            <p>Playground - Interface Smart Device</p>
          </app-tile>
        </router-link>-->

        <router-link to="/applications/examples/model-viewer" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="cubes" class="tile-menu-icon" />
            <p>Model Viewer</p>
          </app-tile>
        </router-link>

        <!--<router-link to="/applications/examples/opencv" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="eye" class="tile-menu-icon" />
            <p>OpenCV</p>
          </app-tile>
        </router-link>-->

        <router-link to="/applications/examples/image-processing" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="camera" class="tile-menu-icon" />
            <p>Image Processing</p>
          </app-tile>
        </router-link>
      </div>
    </div>

    <!--<div class="tile-menu-category">
      <div class="tile-menu-category-seperator">
        <span class="tile-menu-category-seperator-label">Smartphone Assisted VR</span>
      </div>

      <div class="tile-menu-list">
        <router-link to="/applications/smartphone-assisted-vr/savr-model-inspector" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="cubes" class="tile-menu-icon" />
            <p>VR Model Inspector</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/smartphone-assisted-vr/savr-laser-pointer" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="hand-pointer" class="tile-menu-icon" />
            <p>VR Laser Pointer</p>
          </app-tile>
        </router-link>

        <router-link to="/applications/smartphone-assisted-vr/savr-keyboard" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent tile-menu-item-background">
            <font-awesome-icon icon="keyboard" class="tile-menu-icon" />
            <p>VR Keyboard</p>
          </app-tile>
        </router-link>
      </div>
    </div>-->

    <!--<div class="tile-menu-category">
      <div class="tile-menu-category-seperator">
        <span class="tile-menu-category-seperator-label">Misc</span>
      </div>

      <div class="tile-menu-list">
        <router-link to="/applications/misc/rock-paper-scissors" class="tile-menu-item" tag="div">
          <app-tile class="layer-three background round shadow purple-accent">
            <font-awesome-icon icon="hand-scissors" class="tile-menu-icon" />
            <p>Rock Paper Scissors</p>
          </app-tile>
        </router-link>
      </div>

      <div class="tile-menu-list"></div>
    </div>-->
  </div>
</template>

<script>
import { AppTile } from './appComponents/appComponents.js';
import PageHeader from './PageHeader.vue';

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
  faCamera,
  faShoePrints
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
  faCamera,
  faShoePrints
);

export default {
  name: 'Applications',
  components: {
    AppTile,
    PageHeader
  }
};
</script>

<style scoped lang="stylus">

@import '../styles/tile-menu';

.wrapper-applications {
  overflow: auto;
  width: 100%;
  height: 100%;
}
</style>
