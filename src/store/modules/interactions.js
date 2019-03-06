// initial state
const state = {
  interactions: []
}
  
// getters
const getters = {
}

// actions
const actions = {
  addInteraction (context, payload) {
    context.commit('increment', {
      interaction: payload.interaction
    })
  }
}

// mutations
const mutations = {
  pushInteraction (state, payload){
    state.interactions.push(payload.interaction);
  }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}