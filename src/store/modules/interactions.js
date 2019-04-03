import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

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

// helpers



let fetchinteractionList = function () {
  console.log("start6 fetching");
  UbiiClientService.client
  .callService({
    topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET_LIST
  })
  .then((list) => {
    console.log("Ive got something: "+list.data);
  });
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
  fetchInteractionList (context, payload) {
    fetchinteractionList();
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