import { Dataset } from './ubiGraph3D/dataset';

export class DataTranslator {
  constructor() {}

  translateFromUbii(session) {
    let copy = Object.assign({}, session);
    let interactionIds = [];
    let idCounter = 0;
    //let nodes = [];
    let //links = [],
      leftLinks = [],
      rightLinks = [];
    let temp = [];

    let dataset = new Dataset(copy.id, copy.name);

    let getTopicToFormatName = (name, id, inputFlag) => {
      let result = '';
      copy.ioMappings.forEach(interactionMapping => {
        if (interactionMapping.interactionId == id) {
          temp = inputFlag
            ? interactionMapping.inputMappings
            : interactionMapping.outputMappings;
          temp.forEach(mapping => {
            if (mapping.name == name) {
              result = inputFlag
                ? mapping.topicSource
                : mapping.topicDestination;
            }
          });
        }
      });
      return result;
    };
    copy.interactions.forEach((interaction, index) => {
      if (interactionIds.includes(interaction.id)) {
        return;
      }
      interactionIds.push(interaction.id);
      copy.interactions[index].id = idCounter++;
      //nodes.push({
      dataset.addNode({
        id: idCounter - 1,
        name: interaction.name,
        tags:
          interaction.tags == null || interaction.tags.length == 0
            ? ['No Tag']
            : interaction.tags,
        links: []
      });
      interaction.inputFormats.forEach(format => {
        leftLinks.push({
          from: getTopicToFormatName(format.internalName, idCounter - 1, true),
          to: idCounter - 1,
          how: format.messageFormat
        });
      });
      interaction.outputFormats.forEach(format => {
        rightLinks.push({
          from: idCounter - 1,
          to: getTopicToFormatName(format.internalName, idCounter - 1, false),
          how: format.messageFormat
        });
      });
    });
    rightLinks.forEach(rLink => {
      leftLinks.forEach(lLink => {
        if (
          rLink.to == lLink.from &&
          rLink.how == lLink.how &&
          rLink.to != ''
        ) {
          //links.push({ source: rLink.from, target: lLink.to });
          dataset.addLink({ source: rLink.from, target: lLink.to });
        }
      });
    });
    return dataset; //{ id: copy.id, name: copy.name, nodes: nodes, links: links };
  }
}

export function randomHexColor() {
  let part = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F'
  ];
  let result = '';
  for (let i = 0; i < 6; i++) {
    result = result + part[Math.floor(Math.random() * 6)];
  }
  return '#' + result;
}
