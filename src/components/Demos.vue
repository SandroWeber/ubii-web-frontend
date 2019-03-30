<template>
  <div>
    <div class="grid">
      <router-link to="/demos/mouse-pointer" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent"> 
          <font-awesome-icon icon="mouse-pointer" class="interface-icon"/>
          <p>Mouse Demo</p>
        </app-tile>
      </router-link>

      <router-link to="/demos/threejs" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="cube" class="interface-icon"/>
          <p>three.js web rendering</p>
        </app-tile>
      </router-link>

      <router-link to="/demos/threejs-webvr" class="interface-link" tag="div">
        <app-tile class="layer-three background round shadow orange-accent">
          <font-awesome-icon icon="vr-cardboard" class="interface-icon"/>
          <p>three.js webVR rendering</p>
        </app-tile>
      </router-link>
    </div>
  </div>
</template>

<script>
  import { AppTile } from './appComponents/appComponents.js';

  // Fontawesome.
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faMousePointer, faCube, faVrCardboard } from '@fortawesome/free-solid-svg-icons'
  library.add(faMousePointer);
  library.add(faCube);
  library.add(faVrCardboard);

  export default {
    name: 'Demos',
    components: {
      AppTile,
    }
  }
</script>

<style scoped lang="stylus">
  .grid
    display: grid
    grid-gap: 15px
    grid-template-columns: 1fr 1fr 1fr 1fr
    margin: 25px

  .interface-link
    text-align: center
    cursor:pointer

  .interface-icon
    width: 50px
    height: 50px
</style>
