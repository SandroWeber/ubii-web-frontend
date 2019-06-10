import Vue from 'vue';

const UbiiEventBus = new Vue({
  data: () => {
    return {
      CONNECT_EVENT: "onConnected",
      DISCONNECT_EVENT: "onDisconnected"
    }
  }
});

export default UbiiEventBus;