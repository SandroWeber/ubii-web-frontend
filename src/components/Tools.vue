<template>
  <div>
    <div class="grid">
      <router-link to="/tools/topic-inspector" class="interface-link">
        <font-awesome-icon icon="eye" class="interface-icon" />
        <p>Topic Inspector</p>
      </router-link>
      <router-link to="/tools/demo-mouse-pointer" class="interface-link">
        <font-awesome-icon icon="mouse-pointer" class="interface-icon" />
        <p>Mouse Demo</p>
      </router-link>
    </div>
  </div>
</template>

<script>
  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faEye, faMousePointer } from '@fortawesome/free-solid-svg-icons'
  library.add(faEye);
  library.add(faMousePointer);

  export default {
    name: 'Interfaces'
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .grid {
    display: grid;
    grid-gap: 15px;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    margin: 25px;
  }

  .interface-link {
    padding: 10px;
    border: 3px solid darkcyan;
    background: black;
    color: cyan;
    text-align: center;
  }

  .interface-icon {
    width: 50px;
    height: 50px;
  }
</style>
