<template>
    <div class="backend-info">
        <label for="server-ip">Server IP</label>
        <input id="server-ip" type="text" v-model="ubiiClientService.serverIP"/>
        <label for="server-port">Server Port</label>
        <input id="server-port" type="text" v-model="ubiiClientService.serverPort"/>
        <button class="button-connect" v-on:click="ubiiClientService.connect()"
                v-bind:class="ubiiClientService.isConnected ? 'green' : 'red'">
            <font-awesome-icon icon="exchange-alt"/>
        </button>
    </div>
</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';

  /* fontawesome */
  import {library} from '@fortawesome/fontawesome-svg-core'
  import {faExchangeAlt} from '@fortawesome/free-solid-svg-icons'

  library.add(faExchangeAlt);

  export default {
    name: 'ServerStatus',
    beforeMount: function () {
      if (!UbiiClientService.isConnected) {
        UbiiClientService.connect();
      }
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService
      }
    }
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

    .green {
        background-color: green;
    }

    .red {
        background-color: red;
    }

    .button-connect {
        margin: 0px 10px 0px 10px;
    }
</style>
