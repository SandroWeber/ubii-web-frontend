import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/index.js'

/* font-awesome */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
Vue.component('font-awesome-icon', FontAwesomeIcon);

/* vue app */
Vue.config.productionTip = false;

new Vue({
    store,
    router,
    render: h => h(App)
  }).$mount('#app');
