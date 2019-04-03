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
const helpers = {
  fetch: function (context) {
    return new Promise((resolve, reject) => {
      try{
        // fetch all interaction data from the backend
        console.log("start fetching");
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET_LIST
        })
        .then((reply) => {
          console.log("Ive got something: "+reply.interactionList.length);

          // clear fetched
          context.commit('clearFetched');
          
          // analyse list and get all interactions and store them to fetched
          // async with all resolved somehow. all have pushed to fetched when resolved

          return resolve();
        });

        
      }catch{
        return reject();
      }
    });
    
  },
  pull: function (context) {
    return new Promise((resolve, reject) => {
      try{
        // clear all
        context.commit('clearAll');

        // set all to fetched

        return resolve();
      }catch{
        return reject();
      }
    });
  },
  register: function (context, payload) {
    return new Promise((resolve, reject) => {
      try{
        // register new interaction at the backend
        console.log("start registering");
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_REGISTRATION,
          interaction: payload.interaction
        })
        .then((reply) => {
          console.log("Ive got something: "+reply);
          
          // resolve on success reject otherwise
          return resolve();
        });
        
      }catch{
        return reject();
      }
    });
    
  }
};



// initial state
const state = {
  all: [dummyInteractionTwo],
  fetched: [],
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

    // register interaction
    helpers.register(context,payload)
    .then(() => {
      helpers.fetch(context)
      .then(() => {
        console.log("boing");
      })
    })

    // then fetch
    // then pull
  },
  update (context, payload) {
    context.commit('setInteraction', payload);

    // replace interaction

    // then fetch
    // then pull
  },
  pullAll (context, payload) {
    helpers.fetch(context)
    .then(() => {
      console.log("boing");
    })

    // then pull
  },
}

// mutations
const mutations = {
  pushInteraction (state, payload){
    state.all.push(payload.interaction);
  },
  clearAll (state){
    state.all = [];
  },
  pushFetchedInteraction (state, payload){
    state.fetched.push(payload.interaction);
  },
  clearFetched (state){
    state.fetched = [];
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