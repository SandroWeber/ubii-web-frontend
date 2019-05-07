import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';

const SYNCHRONIZATION_SERVICE_INTERVAL_TIME = 1000; // in ms
let synchronizationServiceInterval = null;
let interactionsToSync = new Map();

// Backend data helper:
const backendData = {
  pull: async function (context) {
    return new Promise((resolve, reject) => {
      try{
        // Get the list with all interactions from the server...
        UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_GET_LIST
        })
        .then(async (reply) => {
          // ... then clear all ...
          context.commit('clearAll');
          // ... and get all new ones. 
          reply.interactionList.forEach(interaction => {
            // TODO resolve deep interaction structure here
            context.commit('pushInteractionRecord', {
              record: {
                "id": interaction.id,
                "text": interaction.name,
                "data": {
                  interaction: interaction,
                }
              }
            });
          });

          return resolve();
        },()=>{
          return reject();
        });
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
  delete: async function (context, interactionId) {
    return await new Promise(async(resolve, reject) => {
      try{
        // Get index of complete interaction specification
        let index = state.all.findIndex(function(element) {
            return element.id === interactionId;
        });

        // delete interaction at the backend
        await UbiiClientService.client
        .callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DELETE,
          interaction: state.all[index]
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
  recordTree: [],
}
  
// getters
const getters = {
    all: state => state.recordTree.map((value)=>{
      // TODO map nested entries
      return value.data.interaction;
    }),
    tree: state => {
      return state.recordTree;
    },
}

// actions
const actions = {
  async add (context, payload) {
    // Register interaction at the backend...
    await backendData.register(context,payload.interaction)

    // ... then pull.
    await actions.pull(context);
  },
  addDefault (context) {
    actions.add(context, {
      interaction: {
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
      }})
  },
  async deleteInteraction (context, payload) {
    // Delete interaction at the backend...
    await backendData.delete(context, payload.currentInteractionId);

    // ... then pull.
    await actions.pull(context);
  },
  async update (context, payload) {
    // Update immediately locally ...
    context.commit('setInteraction', payload);

    // ... and add it to the toSync list.
    interactionsToSync.set(payload.interaction.id, payload.interaction);
  },
  async pull (context) {
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

    }, SYNCHRONIZATION_SERVICE_INTERVAL_TIME);
  },
  stopSynchronizationService(){
    if(synchronizationServiceInterval){
      clearInterval(synchronizationServiceInterval);
    }
  },
  updateTree(context, tree) {
    context.commit('updateRecordTree', tree)
  }
}

// mutations
const mutations = {
  pushInteractionRecord (state, payload){
    state.recordTree.push(payload.record);
    console.log(state.recordTree);
  },
  clearAll (state){
    state.recordTree = [];
  },
  setInteraction (state, payload){
    let id = payload.interaction.id;
    let index = state.recordTree.findIndex(function(element) {
        return element.id === id;
    });
    if(index !== -1){
      state.recordTree[index].interaction = payload.interaction;
      state.recordTree[index].name = payload.interaction.name;
    }
  },
  removeInteraction (state, payload){
    let id = payload.currentInteractionId;
    // TODO Add recursive find
    let index = state.recordTree.findIndex(function(element) {
        return element.id === id;
    });
    if(index !== -1){
      state.recordTree.splice(index, 1);
    }
  },
  updateRecordTree(state, newTree) {
    state.recordTree = newTree
  }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}