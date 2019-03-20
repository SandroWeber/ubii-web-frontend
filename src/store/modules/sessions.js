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
    context.commit('pushSessionToAll', {
      session: payload.session
    })
  }
}

// mutations
const mutations = {
  pushSessionToAll (state, payload){
    state.all.push(payload.session);
  }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}