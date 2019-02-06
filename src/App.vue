<template>
  <div id="app" class="layer-one background">
    <server-status id="server-status"/>
    <nav class="navigation-bar layer-one background border">
      <router-link to="/" class="navigation-item ">Home</router-link> |
      <router-link to="/admin" class="navigation-item">Administration</router-link> |
      <router-link to="/tools" class="navigation-item">Tools</router-link> |
      <router-link to="/nodeEditor" class="navigation-item">Node Editor</router-link>
    </nav>
    
    <router-view class="router-view"/>
  </div>
</template>

<script>
  import ClientNode from './services/ubiiClientNodeService';
  import ServerStatus from './components/ServerStatus.vue'

  export default {
    name: 'app',
    components: {
      ServerStatus
    },
    data: () => {
      return {
        clientNode: ClientNode
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
  }

  .navigation-bar {
    padding: 15px;
    text-align: center;
    z-index: 900
  }

  .navigation-item {
    padding: 0px 20px 0px 20px;
    text-decoration: none
  }

  #server-status
    position: relative
    z-index: 1000

  .server-stats {
    text-align: center;
  }

</style>
