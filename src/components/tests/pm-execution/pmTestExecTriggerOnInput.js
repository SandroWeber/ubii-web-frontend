export default class PMTestExecutionTriggerOnInput {
  static NAME_IN_DOUBLE = 'inDouble';
  static NAME_OUT_DOUBLE = 'outDouble';
  static NAME_IN_MUX_STRINGS = 'inMuxStrings';
  static NAME_OUT_MUX_STRING_LENGTHS = 'outMuxStringLengths';

  static TEMPLATE = {
    name: 'pm_test-exec_trigger-on-input',
    tags: ['test', 'trigger on input'],
    processingMode: {
      triggerOnInput: {
        minDelayMs: 0,
        allInputsNeedUpdate: false
      }
    },
    inputs: [
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE,
        messageFormat: 'double'
      },
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_IN_MUX_STRINGS,
        messageFormat: 'string',
        isMuxed: true //TODO: add to msg-formats
      }
    ],
    outputs: [
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_OUT_DOUBLE,
        messageFormat: 'double'
      },
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_OUT_MUX_STRING_LENGTHS,
        messageFormat: 'int32',
        isMuxed: true //TODO: add to msg-formats
      }
    ],
    onProcessingStringified: undefined,
    nodeId: undefined
  };

  static onCreated(state) {
    state.mapStringLengths = new Map();
  }

  //static NAME_IN_DOUBLE = 'inDouble';
  //static NAME_OUT_DOUBLE = 'outDouble';
  //static NAME_IN_MUX_STRINGS = 'inMuxStrings';
  //static NAME_OUT_MUX_STRING_LENGTHS = 'outMuxStringLengths';
  static onProcessing(deltaTime, inputs, state) {
    let outputs = {};

    // check if changed, otherwise no output
    if (inputs.inDouble.double && inputs.inDouble.double !== state.lastInDouble) {
      state.lastInDouble = inputs.inDouble.double;
      outputs.outDouble = {
        double: inputs.inDouble.double
      }
    }

    if (inputs.inMuxStrings && inputs.inMuxStrings.elements && inputs.inMuxStrings.elements.length > 0) {
      let muxRecords = inputs.inMuxStrings.elements;
      outputs.outMuxStringLengths = { elements: [] };
      for (let i = 0; i < muxRecords.length; i++) {
        let muxStringRecord = muxRecords[i];
        let topic = muxStringRecord.topic;
        let inputString = muxStringRecord[muxStringRecord.type];
        // detect if string length is new or has changed, if not do not produce output
        if (!state.mapStringLengths.has(topic) || state.mapStringLengths.get(topic) !== inputString.length) {
          outputs.outMuxStringLengths.elements.push({
            int32: inputString.length,
            outputTopicParams: [muxStringRecord.identity]
          });
        }
        // update map
        state.mapStringLengths.set(topic, inputString.length);
      }
    }

    return { outputs, state };
  }

  static getProtobuf(nameSuffix, nodeId) {
    let specs = Object.assign({}, PMTestExecutionTriggerOnInput.TEMPLATE);
    specs.name += nameSuffix;
    specs.onCreatedStringified = PMTestExecutionTriggerOnInput.onCreated.toString();
    specs.onProcessingStringified = PMTestExecutionTriggerOnInput.onProcessing.toString();
    specs.nodeId = nodeId;

    return specs;
  }
}
