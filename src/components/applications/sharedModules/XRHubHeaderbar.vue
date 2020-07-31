<template>
    <div class="xr-hub-headerbar">
        <a class="xr-hub-url" v-bind:href=url>Room URL</a>
        <button v-on:click=this.$props.xrHub.togglePointerEvents class="toggle-website-interaction-button">Toggle Website Interaction</button>
    </div>
</template>

<script>
  import { XR_HUB_ROOM_URL } from './XRHubConstants';

  export default {
    name: 'XRHubHeaderbar.vue',
    props: ['xrHub'],
    data() {
      return {}
    },
    computed: {
      url: function () {
        const roomId = this.$props.xrHub.roomId;
        return window.location.protocol+'//' + window.location.hostname + ':' + window.location.port + XR_HUB_ROOM_URL + roomId;
      }
    }
  };
</script>

<style scoped>
    .xr-hub-headerbar{
        height: 30px;
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: space-between;
        background: #19181a;
    }
    .xr-hub-url{
        width: fit-content;
        height: 20px;
        color: white;
        padding-top: 5px;
    }
</style>