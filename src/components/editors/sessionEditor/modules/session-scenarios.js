import uuidv4 from 'uuid/v4';

let scenarios = [
  {
    id: '0',
    name: 'Scenario 1',
    session: {
      interactions: [{
        id: '0',
        name: 'interaction_0',
        processingCallback: () => {},
        processFrequency: 60,
        inputFormats: [
          {
            internalName: 'input-name_0',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
        ],
        outputFormats: [
          {
            internalName: 'output-name_0',
            messageFormat: 'ubii.dataStructure.Vector2'
          }
        ]
      }, {
        id: '1',
        name: 'interaction_1',
        tags: ['Calc 1', 'Calc 2'],
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
        id: '2',
        name: 'interaction_2',
        tags: ['Calc 2'],
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
        id: '3',
        name: 'interaction_3',
        tags: ['Calc 2'],
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
      },],
      ioMappings: [
        {
          interactionId: '0',
          inputMappings: [
            {
              name: 'input-name_0',
              topicSource: 'topic0'
            },
          ],
          outputMappings: [
            {
              name: 'output-name_0',
              topicDestination: 'topic1'
            }
          ]
        },
        {
          interactionId: '1',
          inputMappings: [
            {
              name: 'input-name_1',
              topicSource: 'topic1'
            },
          ],
          outputMappings: [
            {
              name: 'output-name_1',
              topicDestination: 'topic2'
            }
          ]
        },
        {
          interactionId: '2',
          inputMappings: [
            {
              name: 'input-name_2',
              topicSource: 'topic1'
            },
          ],
          outputMappings: [
            {
              name: 'output-name_2',
              topicDestination: 'topic2'
            }
          ]
        },
        {
          interactionId: '3',
          inputMappings: [
            {
              name: 'input-name_3',
              topicSource: 'topic2'
            },
          ],
          outputMappings: [
            {
              name: 'output-name_3',
              topicDestination: 'topic3'
            }
          ]
        }
      ],
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

