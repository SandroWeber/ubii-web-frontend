
// initial state
const state = {
  all: []
}
  
// getters
const getters = {
    all: state => state.all
}

// actions
const actions = {
  add (context, payload) {
    context.commit('pushInteraction', {
      interaction: payload.interaction
    })
  }
}

// mutations
const mutations = {
  pushInteraction (state, payload){
    state.all.push(payload.interaction);
  }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}