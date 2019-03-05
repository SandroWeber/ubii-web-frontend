import Vue from 'vue'
import Vuex from 'vuex'
import interactions from './modules/interactions'
import sessions from './modules/sessions'
import createLogger from '../../../src/plugins/logger'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    interactions,
    sessions
  },
  strict: debug,
  plugins: debug ? [createLogger()] : []
})