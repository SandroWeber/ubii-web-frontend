<template>
  <div>
    <div class="grid">
      <router-link to="/admin" class="interface-link">
        <font-awesome-icon icon="cogs" class="interface-icon" />
        <p>Administration</p>
      </router-link>
      <router-link to="/tools" class="interface-link">
        <font-awesome-icon icon="toolbox" class="interface-icon" />
        <p>Tools</p>
      </router-link>
    </div>
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
