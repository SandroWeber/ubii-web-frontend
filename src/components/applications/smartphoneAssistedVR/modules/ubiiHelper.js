import uuidv4 from "uuid/v4";


function createUbiiSpecs(name, inputs, outputs, callback) {

  let filterTopics = function (x) {
    return {
      internalName: x.internalName,
      messageFormat: x.messageFormat
    };
  };

  let interaction = {
    id: uuidv4(),
    name: name,
    processingCallback: callback.toString(),
    inputFormats: inputs.map(filterTopics),
    outputFormats: outputs.map(filterTopics)
  };

  let createMappingInp = function (x) {
    return {
      interactionId: interaction.id,
      interactionInput: {
        internalName: x.internalName,
        messageFormat: x.messageFormat
      },
      topic: x.topic
    };
  };

  let createMappingOut = function (x) {
    return {
      interactionId: interaction.id,
      interactionOutput: {
        internalName: x.internalName,
        messageFormat: x.messageFormat
      },
      topic: x.topic
    };
  };

  let session = {
    id: uuidv4(),
    name: name,
    interactions: [interaction],
    ioMappings: inputs.map(createMappingInp).concat(outputs.map(createMappingOut))
  };

  return {
    interaction: interaction,
    session: session
  };

}

export {
  createUbiiSpecs
};