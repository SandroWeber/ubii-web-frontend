// Dummy interaction.
let dummyInteractionOne =
  {
    id: '1234',
    name: 'Dummy Interaction One',
    processingCallback: `(input, output, state) => {
  return true;
}`,
  inputFormats: [
    {
        internalName: 'input-A',
        messageFormat: 'topic-A'
    },
    {
        internalName: 'input-B',
        messageFormat: 'topic-B'
    }
  ],
  outputFormats: [
    {
        internalName: 'output-X',
        messageFormat: 'topic-X'
    },
    {
        internalName: 'output-Y',
        messageFormat: 'topic-Y'
    }
  ]
};

let dummyInteractionTwo = {
  id: 'uuidv4()',
  name: 'mirror-mouse-pointer',
  processingCallback: `(input, output, state) => {
  return true;
}`,
  inputFormats: [
    {
      internalName: 'inputClientPointer.internalName',
      messageFormat: 'inputClientPointer.messageFormat'
    },
    {
      internalName: 'inputMirror.internalName',
      messageFormat: 'inputMirror.messageFormat'
    }
  ],
  outputFormats: [
    {
      internalName: 'outputServerPointer.internalName',
      messageFormat: 'outputServerPointer.messageFormat'
    }
  ]
};

// initial state
const state = {
  all: [dummyInteractionOne, dummyInteractionTwo]
}
  
// getters
const getters = {
    flavor: state => state.flavor
}

// actions
const actions = {
  add (context, payload) {
    context.commit('pushInteraction', {
      interaction: payload.interaction
    })
  }
}

// mutations
const mutations = {
  pushInteraction (state, payload){
    state.all.push(payload.interaction);
  }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}