<template>
  <div>
    <div class="grid">
      <router-link
        to="/tools/topic-inspector"
        class="interface-link"
        tag="li"
      >
        <app-tile class="layer-three background round shadow orange-accent"> 
          <font-awesome-icon
            icon="eye"
            class="interface-icon"
          />
          <p>
            Topic Inspector
          </p>
        </app-tile>
      </router-link>
      <router-link
        to="/tools/demo-mouse-pointer"
        class="interface-link"
      >
        <app-tile class="layer-three background round shadow orange-accent"> 
          <font-awesome-icon
            icon="mouse-pointer"
            class="interface-icon"
            tag="li"
          />
          <p>
            Mouse Demo
          </p>
        </app-tile>
      </router-link>
    </div>
  </div>
</template>

<script>
  import AppTile from './appComponents/AppTile.vue';

  // Fontawesome.
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faEye, faMousePointer } from '@fortawesome/free-solid-svg-icons'
  library.add(faEye);
  library.add(faMousePointer);

  export default {
    name: 'Interfaces',
    components: {
      AppTile: AppTile
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

  .interface-icon
    width: 50px
    height: 50px
</style>
