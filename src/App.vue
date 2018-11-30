<template>
  <div id="app">
    <h2 class="server-stats">Ubi-Interact Backend = {{ clientNode.serverIP }} : {{ clientNode.serverPort }}</h2>
    <nav class="navigation-bar">
      <router-link to="/">Home</router-link> |
      <router-link to="/configuration">Server Configuration</router-link> |
      <router-link to="/interfaces">Interfaces</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script>
  import ClientNode from './services/ubiiClientNode';

  export default {
    name: 'app',
    data: () => { return {
      clientNode: ClientNode
    }}
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
