<template>
  <div 
    id="app"
    class="layer-one background"
  >
    <server-status id="server-status"/>
    <nav class="navigation-bar layer-one background border shadow">
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
    
    <router-view class="router-view"/>
  </div>
</template>

<script>
  import ClientNode from './services/ubiiClient/ubiiClientService';
  import ServerStatus from './components/ServerStatus.vue'

  // Dummy interaction.
  let dummyInteractionOne =
  {
      id: '1234',
      name: 'Dummy Interaction One',
      processingCallback: `(input, output, state) => {
  return true;
}`,
  inputFormats: [
      {
          internalName: 'input-A',
          messageFormat: 'topic-A'
      },
      {
          internalName: 'input-B',
          messageFormat: 'topic-B'
      }
  ],
  outputFormats: [
      {
          internalName: 'output-X',
          messageFormat: 'topic-X'
      },
      {
          internalName: 'output-Y',
          messageFormat: 'topic-Y'
      }
  ]
  };

  let dummyInteractionTwo = {
  id: 'uuidv4()',
  name: 'Second Test',
  processingCallback: `(input, output, state) => {
  return true;
}`,
  inputFormats: [
      {
          internalName: 'inputClientPointer',
          messageFormat: 'inputClientPointer.messageFormat'
      },
      {
          internalName: 'inputMirror',
          messageFormat: 'inputMirror.messageFormat'
      }
  ],
  outputFormats: [
      {
          internalName: 'outputServerPointer',
          messageFormat: 'outputServerPointer.messageFormat'
      }
  ]
  };

  let dummyInteractionThree = {
id: 'three',
name: 'TestThree',
processingCallback: `(input, output, state) => {
return true;
}`,
  inputFormats: [
      {
          internalName: 'inputClientPointer',
          messageFormat: 'inputClientPointer.messageFormat'
      },
      {
          internalName: 'inputMirror',
          messageFormat: 'inputMirror.messageFormat'
      }
  ],
  outputFormats: [
      {
          internalName: 'outputServerPointer',
          messageFormat: 'outputServerPointer.messageFormat'
      }
  ]
  };

  export default {
    name: 'app',
    components: {
      ServerStatus
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
  * {
      margin: 0;
      padding: 0;
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
