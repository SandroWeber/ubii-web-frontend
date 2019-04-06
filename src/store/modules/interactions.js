import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

// default interaction
let defaultInteraction = {
  id: uuidv4(),
  name: 'New Interaction',
  processingCallback: `(input, output, state) => {

  // Your code here.

  output.defaultOut = input.defaultIn;
}`,
  inputFormats: [
          {
              "internalName": "defaultIn",
              "messageFormat": "messageFormat"
          }
      ],
  outputFormats: [
          {
              "internalName": "defaultOut",
              "messageFormat": "messageFormat"
          }
      ],
  };

let defaultInterfaceEntry = {
  "internalName": "default",
  "messageFormat": "messageFormat"
};

// helpers
const helpers = {
  fetch: function (context) {
    return new Promise((resolve, reject) => {
      try{
        // fetch all interaction data from the backend
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET_LIST
        })
        .then((reply) => {
          console.log("Fetch Service Reply: Ive got something: "+reply.interactionList.length);

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
          interaction: {
            id: "uuidv4()testid",
            name: "New Interaction",
            processingCallback: "(input, output, state) => {}",
            inputFormats: [
                    {
                        "internalName": "defaultIn",
                        "messageFormat": "messageFormat"
                    }
                ],
            outputFormats: [
                    {
                        "internalName": "defaultOut",
                        "messageFormat": "messageFormat"
                    }
                ],
            }
        })
        .then((reply) => {
          console.log("Register Sevice Reply: Ive got something: "+reply);
          
          // resolve on success reject otherwise
          return resolve();
        },()=>{
          console.log("Register Sevice Rejected.");
        });
        
      }catch{
        return reject();
      }
    });
  }
};


// initial state
const state = {
  all: [defaultInteraction],
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
        console.log("after fetched in add");
      })
    })

    // then fetch
    // then pull
  },
  addDefault (context) {
    actions.add(context, {
      interaction: defaultInteraction
    })
  },
  update (context, payload) {
    context.commit('setInteraction', payload);

    // replace interaction

    // then fetch
    // then pull
  },
  pullAll (context) {
    helpers.fetch(context)
    .then(() => {
      console.log("after fetched in pullAll");
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