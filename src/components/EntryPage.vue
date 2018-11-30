<template>
  <div id="page-grid">
    <router-link to="/configuration">
      <font-awesome-icon icon="cogs" class="page-icon" />
    </router-link>
    <router-link to="/interfaces">
      <font-awesome-icon icon="gamepad" class="page-icon" />
    </router-link>
  </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faCogs, faGamepad } from '@fortawesome/free-solid-svg-icons'

  library.add(faCogs);
  library.add(faGamepad);

  export default {
    name: 'EntryPage',
    components: {}
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #page-grid {
    display: grid;
    grid-gap: 15px;
    grid-template-columns: 1fr 1fr;
    margin: 25px;

    text-align: center;
  }

  .page-icon {
    width: 100px;
    height: 100px;
    color: cyan;
    background: black;
    padding: 10px;
    border: 3px solid darkcyan;
  }
</style>
