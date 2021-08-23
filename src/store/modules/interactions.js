import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

const SYNCHRONIZATION_SERVICE_INTERVAL_TIME = 1000; // in ms
const DEFAULT_PROCESS_FREQUENCY = 30; // 30 Hz
let synchronizationServiceInterval = null;
let interactionsToSync = new Map();

// Backend data helper:
const backendData = {
  pull: async function(context) {
    return new Promise(async (resolve, reject) => {
      try {
        // clear all ...
        context.commit('clearAll');

        // Get the list with all local interactions from the server...
        let replyLocalDB = await UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DATABASE_LOCAL_GET_LIST
        });
        replyLocalDB.interactionList &&
          replyLocalDB.interactionList.forEach(interaction => {
            // TODO resolve deep interaction structure here
            context.commit('pushInteractionRecord', {
              record: {
                id: interaction.id,
                label: interaction.name,
                editable: true,
                data: {
                  interaction: interaction
                }
              }
            });
          });

        // Get the list with all online interactions from the server...
        let replyOnlineDB = await UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DATABASE_ONLINE_GET_LIST
        });
        replyOnlineDB.interactionList &&
          replyOnlineDB.interactionList.forEach(interaction => {
            // TODO resolve deep interaction structure here
            context.commit('pushInteractionRecord', {
              record: {
                id: interaction.id,
                label: interaction.name,
                editable: false,
                data: {
                  interaction: interaction
                }
              }
            });
          });

        return resolve();
      } catch (error) {
        return reject(error);
      }
    });
  },
  register: async function(context, interaction) {
    return await new Promise(async (resolve, reject) => {
      try {
        // register new interaction at the backend
        await UbiiClientService.instance
          .callService({
            topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DATABASE_SAVE,
            interaction: interaction
          })
          .then(
            reply => {
              if (reply.error) {
                return reject();
              } else {
                return resolve();
              }
            },
            () => {
              return reject();
            }
          );
      } catch {
        return reject();
      }
    });
  },
  delete: async function(context, interaction) {
    return await new Promise(async (resolve, reject) => {
      try {
        // delete interaction at the backend
        await UbiiClientService.instance
          .callService({
            topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DATABASE_DELETE,
            interaction: interaction
          })
          .then(
            reply => {
              if (reply.error) {
                return reject();
              } else {
                return resolve();
              }
            },
            () => {
              return reject();
            }
          );
      } catch {
        return reject();
      }
    });
  },
  update: async function(context, interaction) {
    return await new Promise(async (resolve, reject) => {
      try {
        await UbiiClientService.instance
          .callService({
            topic: DEFAULT_TOPICS.SERVICES.INTERACTION_DATABASE_SAVE,
            interaction: interaction
          })
          .then(
            reply => {
              if (reply.error) {
                return reject();
              } else {
                return resolve();
              }
            },
            () => {
              return reject();
            }
          );
      } catch {
        return reject();
      }
    });
  }
};

// initial state
const state = {
  recordTree: []
};

// getters
const getters = {
  all: state =>
    state.recordTree.map(value => {
      // TODO map nested entries
      return value.data.interaction;
    }),
  tree: state => {
    return state.recordTree;
  }
};

// actions
const actions = {
  async add(context, payload) {
    // Register interaction at the backend...
    await backendData.register(context, payload.interaction);

    // ... then pull.
    await actions.pull(context);
  },
  addDefault(context) {
    actions.add(context, {
      interaction: {
        name: 'New Interaction',
        authors: ['author 1', 'author 2'],
        tags: ['tag1', 'tag2'],
        description: 'Enter description here.',
        onCreated: `(state) => {
  // Your initialization code here.
}`,
        processFrequency: DEFAULT_PROCESS_FREQUENCY,
        processingCallback: `(inputs, outputs, state) => {

  // Your code here.

  outputs.defaultOut = inputs.defaultIn;
}`,
        inputFormats: [
          {
            internalName: 'defaultIn',
            messageFormat: 'messageFormat'
          }
        ],
        outputFormats: [
          {
            internalName: 'defaultOut',
            messageFormat: 'messageFormat'
          }
        ]
      }
    });
  },
  async deleteInteraction(context, payload) {
    // Delete interaction at the backend...
    await backendData.delete(context, payload.interaction);

    // ... then pull.
    await actions.pull(context);
  },
  async update(context, payload) {
    // Update immediately locally ...
    context.commit('setInteraction', payload);

    // ... and add it to the toSync list.
    interactionsToSync.set(payload.interaction.id, payload.interaction);
  },
  async updateImmediately(context, payload) {
    //console.info('updateImmediately');
    //console.info(payload);
    // Update immediately locally ...
    context.commit('setInteraction', payload);

    // ... and call backend service.
    await backendData.update(context, payload.interaction);
  },
  async pull(context) {
    await backendData.pull(context);
  },
  startSynchronizationService(context) {
    if (synchronizationServiceInterval) {
      clearInterval(synchronizationServiceInterval);
    }

    synchronizationServiceInterval = setInterval(async () => {
      for (var value of interactionsToSync.values()) {
        await backendData.update(context, value);
      }
      interactionsToSync.clear();
    }, SYNCHRONIZATION_SERVICE_INTERVAL_TIME);
  },
  stopSynchronizationService() {
    if (synchronizationServiceInterval) {
      clearInterval(synchronizationServiceInterval);
    }
  },
  updateTree(context, tree) {
    context.commit('updateRecordTree', tree);
  }
};

// mutations
const mutations = {
  pushInteractionRecord(state, payload) {
    state.recordTree.push(payload.record);
  },
  clearAll(state) {
    state.recordTree = [];
  },
  setInteraction(state, payload) {
    let id = payload.interaction.id;
    let index = state.recordTree.findIndex(function(element) {
      return element.id === id;
    });
    if (index !== -1) {
      state.recordTree[index].interaction = payload.interaction;
      state.recordTree[index].label = payload.interaction.name;
    }
  },
  removeInteraction(state, payload) {
    let id = payload.currentInteractionId;
    // TODO Add recursive find
    let index = state.recordTree.findIndex(function(element) {
      return element.id === id;
    });
    if (index !== -1) {
      state.recordTree.splice(index, 1);
    }
  },
  updateRecordTree(state, newTree) {
    state.recordTree = newTree;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
