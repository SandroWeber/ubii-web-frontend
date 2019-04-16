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

let interactionsToSync = new Map();
let synchronizationServiceInterval = null;

// Backend data helper:
const backendData = {
  fetch: async function (context) {
    return new Promise((resolve, reject) => {
      try{
        // Get the list with all interactions from the server.
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET_LIST
        })
        .then(async (reply) => {
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
        context.state.fetched.forEach(interaction => {
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
  register: async function (context, interaction) {
    return await new Promise(async(resolve, reject) => {
      try{
        // register new interaction at the backend
        await UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_REGISTRATION,
          interaction: interaction
        })
        .then((reply) => {
          if(reply.error){
            return reject();
          }else{
            return resolve();
          }
        },()=>{
          return reject();
        });
      }catch{
        return reject();
      }
    });
  },
  update: async function(context, interaction){
    return await new Promise(async (resolve, reject) => {
      try{
        await UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_REPLACE,
          interaction: interaction
        })
        .then((reply) => {
          if(reply.error){
            return reject();
          }else{
            return resolve();
          }
        },()=>{
          return reject();
        });
      }catch{
        return reject();
      }
    });
  },
};


// initial state
const state = {
  all: new Map,
  fetched: new Map,
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

    // Register interaction at the backend.
    await backendData.register(context,payload.interaction)
  },
  addDefault (context) {
    actions.add(context, {
      interaction: createDefaultInteraction()
    })
  },
  deleteInteraction (context, payload) {
    context.commit('removeInteraction', payload);

    // todo service call
  },
  async update (context, payload) {
    context.commit('setInteraction', payload);

    interactionsToSync.set(payload.interaction.id, payload.interaction);
  },
  async pullAll (context) {
    // Fetch ...
    await backendData.fetch(context);

    // ... then pull.
    await backendData.pull(context);
  },
  startSynchronizationService(context){
    if(synchronizationServiceInterval){
      clearInterval(synchronizationServiceInterval);
    }

    synchronizationServiceInterval = setInterval(async ()=>{
      for (var value of interactionsToSync.values()) {
        await backendData.update(context, value);
      }
      interactionsToSync.clear();

      //await actions.pullAll(context);
    }, 1000);
  },
  stopSynchronizationService(context){
    if(synchronizationServiceInterval){
      clearInterval(synchronizationServiceInterval);
    }
  },
}

// mutations
const mutations = {
  pushInteraction (state, payload){
    state.all.set(payload.interaction.id, payload.interaction);
  },
  clearAll (state){
    state.all = new Map;
  },
  setInteraction (state, payload){
    state.all.set(payload.currentInteractionId, payload.interaction);
  },
  removeInteraction (state, payload){
    state.all.delete(payload.currentInteractionId, payload.interaction);
  },
  pushFetchedInteraction (state, payload){
    state.fetched.set(payload.interaction.id, payload.interaction);
  },
  clearFetched (state){
    state.fetched = new Map;
  },
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}