<template>
  <app-layer 
    id="app"
    class="layer-one background"
  >
    <server-status id="server-status"/>
    <app-layer class="layer-one layer-one background border shadow">
      <nav class="navigation-bar">
        <router-link
          to="/"
          class="navigation-item "
        >
          Home
        </router-link>
        |
        <router-link
          to="/admin"
          class="navigation-item"
        >
          Administration
        </router-link>
        |
        <router-link
          to="/tools"
          class="navigation-item"
        >
        Tools
        </router-link>
        |
        <router-link
          to="/nodeEditor"
          class="navigation-item"
        >
        Node Editor
        </router-link>
        |
        <router-link
          to="/interactionEditor"
          class="navigation-item"
        >
          Interaction Editor
        </router-link>
      </nav>
    </app-layer>
    
    <router-view class="router-view"/>
  </app-layer>
</template>

<script>
  import ClientNode from './services/ubiiClient/ubiiClientService';
  import ServerStatus from './components/ServerStatus.vue'
  import { AppLayer } from './components/appComponents/appComponents.js';
  import uuidv4 from 'uuid/v4';

  // Dummy interaction.
  let dummyInteractionOne = {
    id: uuidv4(),
    name: 'Dummy Interaction One',
    processingCallback: `(input, output, state) => {

  // Your code here.
  
  output.defaultOut = input.defaultIn;
}`,
    inputFormatString: `[
  {
      "internalName": "Alpha",
      "messageFormat": "messageFormat"
  },
  {
      "internalName": "Beta",
      "messageFormat": "messageFormat"
  }
]`,
    inputFormats: [],
    outputFormatString: `[
  {
      "internalName": "First",
      "messageFormat": "messageFormat"
  },
  {
      "internalName": "Second",
      "messageFormat": "messageFormat"
  }
]`,
    outputFormats: []
  };
  
  let dummyInteractionTwo = {
    id: uuidv4(),
    name: 'Pointer Test',
    processingCallback: `(input, output, state) => {

  // Your code here.
  
  output.defaultOut = input.defaultIn;
}`,
    inputFormatString: `[
  {
      "internalName": "inputClientPointer",
      "messageFormat": "messageFormat"
  },
  {
      "internalName": "inputMirror",
      "messageFormat": "messageFormat"
  }
]`,
    inputFormats: [],
    outputFormatString: `[
  {
      "internalName": "outputServerPointer",
      "messageFormat": "messageFormat"
  }
]`,
    outputFormats: []
  };
  
  let dummyInteractionThree = {
    id: uuidv4(),
    name: 'Test Three',
    processingCallback: `(input, output, state) => {

  // Your code here.
  
  output.defaultOut = input.defaultIn;
}`,
    inputFormatString: `[
  {
      "internalName": "Anna",
      "messageFormat": "messageFormat"
  }
]`,
    inputFormats: [],
    outputFormatString: `[
  {
      "internalName": "Bob",
      "messageFormat": "messageFormat"
  }
]`,
    outputFormats: []
  };

  export default {
    name: 'app',
    components: {
      ServerStatus,
      AppLayer
    },
    data: () => {
      return {
        ubiiClientService: ClientNode
      }
    },
    mounted(){
      this.$store.dispatch("interactions/add", {interaction: dummyInteractionOne});
      this.$store.dispatch("interactions/add", {interaction: dummyInteractionTwo});
      this.$store.dispatch("interactions/add", {interaction: dummyInteractionThree});
    }
  }
</script>

<style lang="stylus"> 
@import "./styles/main/color"

  * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -moz-box-sizing: border-box;
      -webkit-box-sizing: border-box;
  }


  html, body {
    width: 100%;   
    height: 100%; 
  } 
 
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: 100%;
    display flex
    flex-direction column
    color: maxContrastColor
  }

  .navigation-bar {
    padding: 15px;
    text-align: center;
  }

  .navigation-item {
    padding: 0px 20px 0px 20px;
    text-decoration: none
  }

  #server-status
    position: relative

  .server-stats {
    text-align: center;
  }

  .router-view

    flex-grow: 1

</style>
