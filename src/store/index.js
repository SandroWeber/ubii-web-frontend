import Vue from 'vue'
import Vuex from 'vuex'
import interactions from './modules/interactions'
//import sessions from './modules/sessions'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    interactions,
   // sessions
  },
})