<template>
  <app-layer
    class="backend-info layer-two background low-contrast horizontal-shadow"
  >
    <label for="server-ip">
      Server IP
    </label>
    <app-input 
      :id="server-ip" 
      :type="text" 
      v-model="ubiiClientService.serverIP" 
      class="layer-four background border round high-contrast"
    />
    <label for="server-port">
      Server Port
    </label>
    <app-input 
      id="server-port"
      type="text"
      v-model="test"
      class="layer-four background border round high-contrast"
    />
    <app-button 
      :class="buttonClassObject"
      @click="connect"
    >
      <font-awesome-icon 
        icon="sync-alt"
        :class="{ transparent: !ubiiClientService.isConnected }"
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
      AppButton: AppButton,
      AppLayer: AppLayer,
      AppInput: AppInput
    },
    beforeMount: function () {
      if (!UbiiClientService.isConnected) {
        UbiiClientService.connect();
      }
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
        console.log("Conenct to "+ this.test)
        this.ubiiClientService.connect();
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
