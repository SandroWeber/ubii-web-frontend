<template>
  <app-layer
    class="backend-info layer-two background low-contrast horizontal-shadow"
  >
    <label for="server-ip">
      Server IP
    </label>
    <app-input 
      :id="'server-ip'" 
      :type="'text'" 
      v-model="ubiiClientService.serverIP" 
    />
    <label for="server-port">
      Server Port
    </label>
    <app-input 
      :id="'server-port'"
      :type="'text'"
      v-model="ubiiClientService.serverPort"
    />
    <app-button 
      :class="buttonClassObject"
      @click="connect"
      :contentSizePercentage="60"
    >
      <font-awesome-icon 
        icon="sync-alt"
        class="connect-icon"
      />
    </app-button>
  </app-layer>
</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';
  import { AppButton, AppLayer, AppInput } from './appComponents/appComponents.js';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faSyncAlt);

  export default {
    name: 'ServerStatus',
    components:{
      AppButton,
      AppLayer,
      AppInput
    },
    beforeMount: function () {
      UbiiClientService.connect();
    },
    beforeDestroy: function() {
      UbiiClientService.disconnect();
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService,
        test: "hallo"
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
        this.ubiiClientService.connect();
      }
    }
  }
</script>

<style scoped lang="stylus">
.backend-info {
  padding: 8px;
  display: grid;
  align-items: center;

  @media (min-width: 600px) {
    grid-template-columns: auto auto auto auto 1fr;
  }
}

  label
    margin: 0px 5px 0px 10px

  input
    padding: 1px 5px 1px 5px

  .button-connect
    height: 1.8em
    width 1.8em
    margin: 2px 10px 2px 10px

  .connect-icon
    width: 100%
    height: 100%
    
</style>
