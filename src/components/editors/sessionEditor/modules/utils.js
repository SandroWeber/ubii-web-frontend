export class DataTranslator {
  constructor() {

  }

  translateFromUbii(session) {
    let copy = Object.assign({}, session);
    let interactionIds = [];
    let idCounter = 0;
    let nodes = [];
    let links = [], leftLinks = [], rightLinks = [];
    let temp = [];

    let getTopicToFormatName = (name, id, inputFlag) => {
      let result = '';
      copy.ioMappings.forEach((interactionMapping) => {
        if(interactionMapping.interactionId == id) {
          temp = inputFlag ? interactionMapping.inputMappings : interactionMapping.outputMappings;
            temp.forEach((mapping) => {
              if(mapping.name == name) {
                result = inputFlag ? mapping.topicSource : mapping.topicDestination;
              }
            });
        }
      });
      return result;
    };
    copy.interactions.forEach((interaction, index) => {
      if(interactionIds.includes(interaction.id)) {
        return;
      }
      interactionIds.push(interaction.id);
      copy.interactions[index].id = idCounter++;
      nodes.push({id: (idCounter-1), name: interaction.name});
      interaction.inputFormats.forEach((format) => {
        leftLinks.push({'from': getTopicToFormatName(format.internalName, (idCounter-1), true), 'to':  (idCounter-1), 'how': format.messageFormat});
      });
      interaction.outputFormats.forEach((format) => {
        rightLinks.push({'from': (idCounter-1), 'to': getTopicToFormatName(format.internalName, (idCounter-1), false), 'how': format.messageFormat});
      });
    });
    rightLinks.forEach((rLink) => {
      leftLinks.forEach((lLink) => {
        if(rLink.to == lLink.from && rLink.how == lLink.how) {
          links.push({'source': rLink.from, 'target': lLink.to});
        }
      });
    });
    return {'nodes': nodes, 'links': links};
  }
}