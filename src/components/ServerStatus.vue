<template>
  <div class="backend-info">
    <label for="server-ip">Server IP</label>
    <input id="server-ip" type="text" v-model="clientNode.serverIP"/>
    <label for="server-port">Server Port</label>
    <input id="server-port" type="text" v-model="clientNode.serverPort"/>
    <button class="button-connect" v-on:click="clientNode.connect()"
            v-bind:class="{ connected: clientNode.isConnected(), disconnected: !clientNode.isConnected() }">
      <font-awesome-icon icon="exchange-alt" />
    </button>
  </div>
</template>

<script>
  import ClientNode from '../services/ubiiClient/ubiiClientNodeService.js';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faExchangeAlt);

  export default {
    name: 'ServerStatus',
    props: {},
    data: () => { return {
      clientNode: ClientNode
    }}
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .backend-info {
    padding: 5px;
    background: black;
    color: cyan;
  }

  label {
    margin: 0px 5px 0px 10px;
  }

  .connected {
    background-color: green;
  }

  .disconnected {
    background-color: red;
  }

  .button-connect {
    margin: 0px 10px 0px 10px;
  }
</style>
