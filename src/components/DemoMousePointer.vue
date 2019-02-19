<template>
    <div>
        <div v-show="!ubiiClientService.isConnected">
            <span class="notification">Please connect to backend before starting the application.</span>
        </div>

        <div v-show="ubiiClientService.isConnected && !demoStarted">
            <button v-on:click="startDemo()">
                <font-awesome-icon icon="play" />
            </button>
        </div>
        <div v-show="ubiiClientService.isConnected && demoStarted" class="grid">
            <div class="options">
                <input id="checkboxClientPointer" type="checkbox" v-model="showClientPointer"/>
                <label for="checkboxClientPointer">Show Client Pointer</label>
                <br/>
                <input id="checkboxServerPointer" type="checkbox" v-model="showServerPointer"/>
                <label for="checkboxServerPointer">Show Server Pointer</label>
            </div>
            <div class="mouse-pointer-area" v-bind:class="{ hideCursor: !showClientPointer }">
            </div>
        </div>
    </div>

</template>

<script>
  import UbiiClientService from '../services/ubiiClient/ubiiClientService.js';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faPlay } from '@fortawesome/free-solid-svg-icons'
  library.add(faPlay);

  export default {
    name: 'DemoMousePointer',
    data: () => {
      return {
        showClientPointer: true,
        showServerPointer: true,
        ubiiClientService: UbiiClientService,
        demoStarted: false
      }
    },
    methods: {
      startDemo: function() {
        UbiiClientService.registerDevice('web-demo-mouse-pointer', 0);
        this.$data.demoStarted = true;
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .grid {
        display: grid;
        grid-gap: 15px;
        grid-template-columns: 1fr 5fr;
        margin: 25px;
    }

    .mouse-pointer-area {
        margin: 25px;
        border: 3px solid black;
        height: 500px;
    }

    .hideCursor {
        cursor: none;
    }

    .notification {
        color: red;
    }
</style>
