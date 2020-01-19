import uuidv4 from 'uuid/v4';

let scenarios = [
  {
    id: '0',
    name: 'Scenario 1',
    session: {
      interactions: [{
        id: uuidv4(),
        name: 'interaction_1',
        processingCallback: () => {},
        processFrequency: 60,
        inputFormats: [
          {
            internalName: 'input-name_1',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
        ],
        outputFormats: [
          {
            internalName: 'output-name_1',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      }, {
        id: uuidv4(),
        name: 'interaction_2',
        processingCallback: () => {},
        processFrequency: 60,
        inputFormats: [
          {
            internalName: 'input-name_2',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
        ],
        outputFormats: [
          {
            internalName: 'output-name_2',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      }, {
        id: uuidv4(),
        name: 'interaction_3',
        processingCallback: () => {},
        processFrequency: 60,
        inputFormats: [
          {
            internalName: 'input-name_3',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
        ],
        outputFormats: [
          {
            internalName: 'output-name_3',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      }, {
        id: uuidv4(),
        name: 'interaction_4',
        processingCallback: () => {},
        processFrequency: 60,
        inputFormats: [
          {
            internalName: 'input-name_4',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
        ],
        outputFormats: [
          {
            internalName: 'output-name_4',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      },],
      ioMappings: [],
      tags: [],
      authors: [],
      id: '',
      name: 'scenario_1'
    }
  },
  {
    id: '1',
    name: 'Scenario 2',
    session: {
      interactions: [],
      ioMappings: [],
      tags: [],
      authors: [],
      id: '',
      name: 'scenario_2'
    }
  }
];

export {
  scenarios
};

