import Vue from 'vue'
import Vuex from 'vuex'
import interactions from './modules/interactions'
import sessions from './modules/sessions'

Vue.use(Vuex)

let store = new Vuex.Store({
  modules: {
    interactions,
    sessions
  },
  mutations: {
		initialiseStore(state) {
			if(localStorage.getItem('store')) {
				// If there is a store in the local storage, set the state object to the stored store.
				this.replaceState(Object.assign(state, JSON.parse(localStorage.getItem('store'))));
			}
		}
	},
});

// Subscribe to store updates.
store.subscribe((mutation, state) => {
	// Store the state object as a JSON string in the local storage.
	localStorage.setItem('store', JSON.stringify(state));
});

export default store;