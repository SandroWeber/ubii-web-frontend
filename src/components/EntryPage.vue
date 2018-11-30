<template>
  <div id="page-grid">
    <router-link to="/admin">
      <font-awesome-icon icon="cogs" class="page-icon" />
    </router-link>
    <router-link to="/interfaces">
      <font-awesome-icon icon="toolbox" class="page-icon" />
    </router-link>
  </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faCogs, faToolbox } from '@fortawesome/free-solid-svg-icons'

  library.add(faCogs);
  library.add(faToolbox);

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
    width: 50px;
    height: 50px;
    color: cyan;
    background: black;
    padding: 10px;
    border: 3px solid darkcyan;
  }
</style>
