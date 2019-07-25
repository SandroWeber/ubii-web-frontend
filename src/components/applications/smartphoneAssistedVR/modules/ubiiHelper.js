import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../../../services/ubiiClient/ubiiClientService';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

function createUbiiSpecs(name, inputs, outputs, callback) {
  const filterTopics = function (x) {
    return {
      internalName: x.internalName,
      messageFormat: x.messageFormat
    };
  };

  const interaction = {
    id: uuidv4(),
    name: name,
    processingCallback: callback.toString(),
    inputFormats: inputs.map(filterTopics),
    outputFormats: outputs.map(filterTopics)
  };

  const createMappingInp = function (x) {
    return {
      name: x.internalName,
      topicSource: x.topic
    };
  }

  const createMappingOut = function (x) {
    return {
      name: x.internalName,
      topicDestination: x.topic
    };
  };

  const session = {
    id: uuidv4(),
    name: name,
    interactions: [interaction],
    ioMappings: [
      {
        interactionId: interaction.id,
        inputMappings: inputs.map(createMappingInp),
        outputMappings: outputs.map(createMappingOut)
      }
    ]
  };

  return {
    interaction: interaction,
    session: session
  };
}

function subscribeSpecs(specs, callback) {
  // eslint-disable-next-line no-console
  console.log('subscribed to ' + specs.topic);

  // start our session (registering not necessary as we do not want to save it permanently)
  UbiiClientService
    .callService({
      topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
      session: specs.session
    })
    .then(() => {
      // subscribe the topic
      UbiiClientService.subscribe(specs.topic, callback);
    });
}

function unsubscribeSpecs(specs) {
  // eslint-disable-next-line no-console
  console.log('unsubscribed to ' + specs.topic);

  UbiiClientService.unsubscribe(specs.topic);

  UbiiClientService.callService({
    topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
    session: specs.session
  });
}

function subscribe(topic, callback) {
  // eslint-disable-next-line no-console
  console.log('subscribed to ' + topic);

  // subscribe the topic
  UbiiClientService.subscribe(topic, callback);
}

function unsubscribe(topics, sessions) {
  topics.forEach(topic => {
    // eslint-disable-next-line no-console
    console.log('unsubscribed to ' + topic);

    UbiiClientService.unsubscribe(topic);
  });
  sessions.forEach(session => {
    UbiiClientService.callService({
      topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
      session: session
    });
  });
}

export {
  createUbiiSpecs,
  subscribeSpecs,
  unsubscribeSpecs,
  subscribe,
  unsubscribe
};
