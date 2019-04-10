import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

// default interaction
let createDefaultInteraction = () => { return {
  id: uuidv4(),
  name: 'New Interaction'+uuidv4(),
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
  }};

// helpers
const helpers = {
  fetch: async function (context) {
    return new Promise((resolve, reject) => {
      try{
        // get th elist with all interactions from the server.
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET_LIST
        })
        .then(async (reply) => {
          console.log("Fetch Service Reply: Ive got something: "+ Object.keys(reply.interactionList[0]) + " length: "+reply.interactionList.length);
          
          /*
          // Get each interaction listet in the interaction list from the server
          const interactionArray = reply.interactionList.map(async listEntry => {
            return UbiiClientService.client
            .callService({
              topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET,
              interaction: {
                id: listEntry.id
              }
            }).then((reply) => {
              return reply.interaction;
            });
          });
          const interactions = await Promise.all(interactionArray);*/

          // Clear fetched.
          context.commit('clearFetched');

          // Set local fetched to the interactions fetched from the server.
          reply.interactionList.forEach(interaction => {
            context.commit('pushFetchedInteraction', 
              {
                interaction: interaction
              });
          });

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
        context.state.fetched.map(interaction => {
          context.commit('pushInteraction', 
            {
              interaction: interaction
            });
        });

        return resolve();
      }catch{
        return reject();
      }
    });
  },
  register: function (context, interaction) {
    return new Promise((resolve, reject) => {
      try{
        // register new interaction at the backend
        console.log("start registering");
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_REGISTRATION,
          interaction: interaction
        })
        .then((reply) => {
          // todo check if success 

          // resolve on success reject otherwise
          return resolve();
        },()=>{
          console.log("Register Sevice Rejected.");
        });
        
      }catch{
        return reject();
      }
    });
  },
  update: function(context, interaction){
    return new Promise((resolve, reject) => {
      try{
        console.log("start update");
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_REPLACE,
          interaction: interaction
        })
        .then((reply) => {
          // TODO check if success
          console.log("Replace service")

          // resolve on success reject otherwise
          return resolve();
        },()=>{
          console.log("Replace Sevice Rejected.");
          return reject();
        });
        
      }catch{
        return reject();
      }
    });
  }
};


// initial state
const state = {
  all: [createDefaultInteraction()],
  fetched: [],
}
  
// getters
const getters = {
    all: state => state.all
}

// actions
const actions = {
  async add (context, payload) {
    context.commit('pushInteraction', {
      interaction: payload.interaction
    });

    // Register interaction.
    await helpers.register(context,payload.interaction)
    
    await actions.pullAll(context);
  },
  addDefault (context) {
    actions.add(context, {
      interaction: createDefaultInteraction()
    })
  },
  async update (context, payload) {
    context.commit('setInteraction', payload);

    // Update interaction.
    await helpers.update(context, payload.interaction)
    
    await actions.pullAll(context);
  },
  async pullAll (context) {
    // Fetch ...
    await helpers.fetch(context);

    // ... then pull.
    await helpers.pull(context);
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
  },
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}