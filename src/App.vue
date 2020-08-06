<template>
  <app-layer id="app" class="layer-one background">
    <div class="page-header-wrapper">
      <!--<server-status id="server-status" />-->
      <page-header />
    </div>
    <app-layer class="navigation-wrapper layer-one background border shadow">
      <nav class="navigation-bar">
        <router-link to="/" class="navigation-item">Home</router-link>|
        <router-link to="/administration" class="navigation-item">Administration</router-link>|
        <router-link to="/tools" class="navigation-item">Tools</router-link>|
        <router-link to="/interfaces" class="navigation-item">Interfaces</router-link>|
        <router-link to="/applications" class="navigation-item">Applications</router-link>
      </nav>
    </app-layer>

    <div class="router-view-wrapper">
      <router-view class="router-view" />
    </div>
  </app-layer>
</template>

<script>
import UbiiClientService from './services/ubiiClient/ubiiClientService';
import PageHeader from './components/PageHeader.vue';
import { AppLayer } from './components/appComponents/appComponents.js';

export default {
  name: 'app',
  components: {
    AppLayer,
    PageHeader
  },
  mounted: () => {
    //UbiiClientService.connect();
    window.addEventListener('beforeunload', () => {
      UbiiClientService.disconnect();
    });
  },
  beforeDestroy: function() {
    UbiiClientService.disconnect();
  }
};
</script>

<style lang="stylus">
@import './styles/main/color';

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
  display: flex;
  flex-direction: column;
  color: maxContrastColor;
  overflow: hidden;
}

.navigation-bar {
  padding: 15px;
  text-align: center;
}

.navigation-item {
  padding: 0px 20px 0px 20px;
  text-decoration: none;
}

#server-status {
  position: relative;
}

.navigation-wrapper {
  flex-grow: 0;
}

.page-header-wrapper {
  flex-grow: 0;
}

.router-view-wrapper {
  flex-grow: 1;
  overflow: hidden;
}

.server-stats {
  text-align: center;
}

.router-view {
  height: 100%;
}

.svg-inline--fa {
  vertical-align: 0;
}
</style>
