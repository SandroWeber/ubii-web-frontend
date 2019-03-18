<template>
  <app-layer 
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
  </app-layer>
</template>

<script>
  import ClientNode from './services/ubiiClient/ubiiClientService';
  import ServerStatus from './components/ServerStatus.vue'
  import { AppLayer } from './components/appComponents/appComponents.js';

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
