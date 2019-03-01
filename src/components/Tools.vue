<template>
  <div>
    <div class="grid">
      <router-link
        to="/tools/topic-inspector"
        class="interface-link layer-three background round shadow button-area orange-accent"
      >
        <font-awesome-icon
          icon="eye"
          class="interface-icon"
        />
        <p>
          Topic Inspector
        </p>
      </router-link>
      <router-link
        to="/tools/demo-mouse-pointer"
        class="interface-link layer-three background round shadow button-area orange-accent"
      >
        <font-awesome-icon
          icon="mouse-pointer"
          class="interface-icon"
        />
        <p>
          Mouse Demo
        </p>
      </router-link>
    </div>
  </div>
</template>

<script>
  // Fontawesome.
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faEye, faMousePointer } from '@fortawesome/free-solid-svg-icons'
  library.add(faEye);
  library.add(faMousePointer);

  export default {
    name: 'Interfaces'
  }
</script>

<style scoped lang="stylus">
  .grid
    display: grid
    grid-gap: 15px
    grid-template-columns: 1fr 1fr 1fr 1fr
    margin: 25px

  .interface-link
    padding: 10px
    text-align: center

  .interface-icon
    width: 50px
    height: 50px
</style>
