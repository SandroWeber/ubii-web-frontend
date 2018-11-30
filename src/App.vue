<template>
  <div id="app">
    <h2 class="server-stats">
      Ubi-Interact Backend = {{ clientNode.connected ? clientNode.serverIP + ':' + clientNode.serverPort : 'not connected' }}
    </h2>
    <nav class="navigation-bar">
      <router-link to="/">Home</router-link> |
      <router-link to="/admin">Administration</router-link> |
      <router-link to="/tools">Tools</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script>
  import ClientNode from './services/ubiiClientNodeService';

  export default {
    name: 'app',
    data: () => {
      return {
        clientNode: ClientNode
      }
    }
  }
</script>

<style>
  body {
    margin: 0px;
  }

  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: white;
  }

  .navigation-bar {
    padding: 10px;
    text-align: center;
  }

  .server-stats {
    text-align: center;
  }
</style>
