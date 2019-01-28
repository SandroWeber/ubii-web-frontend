<template>
  <div id="app">
    <server-status />
    <nav class="navigation-bar">
      <router-link to="/" class="navigation-item">Home</router-link> |
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

<style>
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
  }

  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: white;
    width: 100%;
    height: 100%;
  }

  .navigation-bar {
    padding: 10px;
    text-align: center;
    background: dimgrey;
  }

  .navigation-item {
    color: cyan;
    padding: 0px 20px 0px 20px;
  }

  .server-stats {
    text-align: center;
  }

  .router-view {
  }
</style>
