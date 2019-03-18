<template>
  <div class="backend-info layer-two background low-contrast horizontal-shadow">
    <label for="server-ip">
      Server IP
    </label>
    <input 
      id="server-ip" 
      type="text" 
      v-model="ubiiClientService.serverIP" 
      class="layer-four background border round high-contrast"
    />
    <label for="server-port">
      Server Port
    </label>
    <input
      id="server-port"
      type="text"
      v-model="ubiiClientService.serverPort"
      class="layer-four background border round high-contrast"
    />
    <AppButton 
      :class="buttonClassObject"
      @click="connect"
    >
      <font-awesome-icon 
        icon="sync-alt"
        :class="{ transparent: !ubiiClientService.isConnected }"
      />
    </AppButton>
  </div>
</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import AppButton from './appComponents/AppButton.vue';
  import AppLayer from './appComponents/AppLayer.vue';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faSyncAlt);

  export default {
    name: 'ServerStatus',
    components:{
      AppButton: AppButton
    },
    beforeMount: function () {
      if (!UbiiClientService.isConnected) {
        UbiiClientService.connect();
      }
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService
      }
    },
    computed:{
      buttonClassObject: function () {
        return {
          "button-connect": true,
          "round": true,
          "green-accent": this.ubiiClientService.isConnected,
          "red-accent": !this.ubiiClientService.isConnected
        }
      }
    },
    methods:{
      connect: function () {
        ubiiClientService.connect();
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
    
</style>
