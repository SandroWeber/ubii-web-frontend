import uuidv4 from 'uuid/v4';

// dummy interaction

let dummyInteractionTwo = {
  id: uuidv4(),
  name: 'Pointer Test',
  processingCallback: `(input, output, state) => {

// Your code here.

output.defaultOut = input.defaultIn;
}`,
inputFormat: {
  source:`[
{
    "internalName": "inputClientPointer",
    "messageFormat": "messageFormat"
},
{
    "internalName": "inputMirror",
    "messageFormat": "messageFormat"
}
]`,
  interpreted: []
},
outputFormat: {
  source:`[
{
    "internalName": "outputServerPointer",
    "messageFormat": "messageFormat"
}
]`,
  interpreted: []
},
};

// initial state
const state = {
  all: [dummyInteractionTwo]
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
    });
  },
  update (context, payload) {
    context.commit('setInteraction', payload);
  },
}

// mutations
const mutations = {
  pushInteraction (state, payload){
    state.all.push(payload.interaction);
  },
  setInteraction (state, payload){
    let id = payload.currentInteractionId;
    let currentInteractionIndex = state.all.findIndex(function(element) {
        return element.id === id;
    });
    state.all[currentInteractionIndex] = payload.interaction;
  }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}