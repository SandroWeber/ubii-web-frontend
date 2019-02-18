<template>
  <div class="backend-info layer-two background low-contrast horizontal-shadow">
    <label for="server-ip">Server IP</label>
    <input 
      id="server-ip" 
      type="text" 
      v-model="clientNode.serverIP" 
      class="layer-four background border round high-contrast"/>
    <label for="server-port">Server Port</label>
    <input
      id="server-port"
      type="text"
      v-model="clientNode.serverPort"
      class="layer-four background border round high-contrast"/>
    <button class="button-connect button"
      v-on:click="clientNode.connect()">
      <font-awesome-icon icon="sync-alt" v-bind:class="{ transparent: !clientNode.connected }" />
    </button>
  </div>
</template>

<script>
  import ClientNode from '../services/ubiiClientNodeService.js';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faSyncAlt);

  export default {
    name: 'ServerStatus',
    props: {},
    data: () => { return {
      clientNode: ClientNode
    }}
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus">
  .backend-info {
    padding: 8px;
  }

  label {
    margin: 0px 5px 0px 10px;
  }

  input
    padding: 1px 5px 1px 5px

  .transparent {
    //opacity: 0.2;
  }

  .button-connect {
    margin: 2px 10px 2px 10px;
    padding: 0px 3px 0px 3px
  }
</style>
