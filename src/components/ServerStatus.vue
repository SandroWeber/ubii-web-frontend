<template>
  <div class="backend-info layer-two background low-contrast horizontal-shadow">
    <label for="server-ip">
      Server IP
    </label>
    <input 
      id="server-ip" 
      type="text" 
      v-model="clientService.serverIP" 
      class="layer-four background border round high-contrast"
    />
    <label for="server-port">
      Server Port
    </label>
    <input
      id="server-port"
      type="text"
      v-model="clientService.serverPort"
      class="layer-four background border round high-contrast"
    />
    <button 
      :class="buttonClassObject"
      @click="clientService.connect()"
    >
      <font-awesome-icon 
        icon="sync-alt"
        :class="{ transparent: !clientService.isConnected }"
      />
    </button>
  </div>
</template>

<script>
  import ClientService from '../services/ubiiClient/ubiiClientService.js';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faSyncAlt);

  export default {
    name: 'ServerStatus',
    props: {},
    data: () => {
      return {
        clientService: ClientService
      }
    },
    computed:{
      buttonClassObject: function () {
        return {
          "button-connect": true,
          "button": true,
          "green-accent": this.clientService.isConnected,
          "red-accent": !this.clientService.isConnected
        }
      }
    }
  }
</script>

<style scoped lang="stylus">
  .backend-info
    padding: 8px

  label
    margin: 0px 5px 0px 10px

  input
    padding: 1px 5px 1px 5px

  .button-connect
    height: 1.8em
    width 1.8em
    margin: 2px 10px 2px 10px
    padding: 0.1em
    border-radius 999px
</style>