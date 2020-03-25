import uuidv4 from 'uuid/v4';

let scenarios = [
  {
    id: '0001',
    name: 'Dataset 1',
    test: true,
    nodes: [
      {
        id: 1,
        name: 'Node 1',
        tags: ['Tag 1', 'Tag 2', 'Tag 3'],
        links: []
      },
      {
        id: 2,
        name: 'Node 2',
        tags: ['Tag 1', 'Tag 2', 'Tag 3'],
        links: []
      },
      {
        id: 3,
        name: 'Node 3',
        tags: ['Tag 1'],
        links: []
      },
      {
        id: 4,
        name: 'Node 4',
        tags: ['Tag 2'],
        links: []
      },
      {
        id: 5,
        name: 'Node 5',
        tags: ['No Tags'],
        links: []
      },
      {
        id: 6,
        name: 'Node 6',
        tags: ['Tag 1'],
        links: []
      },
      {
        id: 7,
        name: 'Node 7',
        tags: ['No Tags'],
        links: []
      }
    ],
    links: [
      {
        source: 1,
        target: 2
      },
      {
        source: 2,
        target: 3
      },
      {
        source: 3,
        target: 4
      },
      {
        source: 4,
        target: 5
      },
      {
        source: 1,
        target: 6
      },
      {
        source: 1,
        target: 7
      }
    ]
  },
  {
    id: '0002',
    name: 'Dataset 2',
    test: true,
    nodes: [
      {
        id: 1,
        name: 'Node 1',
        tags: ['Tag 1', 'Tag 2', 'Tag 3'],
        links: []
      },
      {
        id: 2,
        name: 'Node 2',
        tags: ['No Tags'],
        links: []
      },
      {
        id: 3,
        name: 'Node 3',
        tags: ['Tag 2'],
        links: []
      },
      {
        id: 4,
        name: 'Node 4',
        tags: ['Tag 1'],
        links: []
      },
      {
        id: 5,
        name: 'Node 5',
        tags: ['Tag 1', 'Tag 6'],
        links: []
      },
      {
        id: 6,
        name: 'Node 6',
        tags: ['Tag 2', 'Tag 3'],
        links: []
      },
      {
        id: 7,
        name: 'Node 7',
        tags: ['Tag 5', 'Tag 6'],
        links: []
      },
      {
        id: 8,
        name: 'Node 8',
        tags: ['No Tags'],
        links: []
      },
      {
        id: 9,
        name: 'Node 9',
        tags: ['Tag 6'],
        links: []
      },
      {
        id: 10,
        name: 'Node 10',
        tags: ['No Tags'],
        links: []
      }
    ],
    links: [
      {
        source: 1,
        target: 2
      },
      {
        source: 2,
        target: 3
      },
      {
        source: 1,
        target: 3
      },
      {
        source: 3,
        target: 4
      },
      {
        source: 2,
        target: 4
      },
      {
        source: 4,
        target: 6
      },
      {
        source: 4,
        target: 5
      },
      {
        source: 5,
        target: 6
      },
      {
        source: 6,
        target: 7
      },
      {
        source: 7,
        target: 8
      },
      {
        source: 8,
        target: 9
      },
      {
        source: 9,
        target: 10
      }
    ]
  },
  {
    id: '0003',
    name: 'Dataset 3',
    test: true,
    nodes: [
      {
        id: 1,
        name: 'Node 1',
        tags: ['Tag 1'],
        links: []
      },
      {
        id: 2,
        name: 'Node 2',
        tags: ['No Tags'],
        links: []
      },
      {
        id: 3,
        name: 'Node 3',
        tags: ['Tag 1', 'Tag 2'],
        links: []
      },
      {
        id: 4,
        name: 'Node 4',
        tags: ['Tag 2'],
        links: []
      },
      {
        id: 5,
        name: 'Node 5',
        tags: ['Tag 1'],
        links: []
      },
      {
        id: 6,
        name: 'Node 6',
        tags: ['No Tags'],
        links: []
      }
    ],
    links: [
      {
        source: 1,
        target: 2
      },
      {
        source: 2,
        target: 3
      },
      {
        source: 3,
        target: 4
      },
      {
        source: 4,
        target: 5
      },
      {
        source: 5,
        target: 6
      },
      {
        source: 6,
        target: 1
      }
    ]
  }
];

export { scenarios };
