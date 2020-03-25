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
        tags: ['No Tags'],
        links: []
      },
      {
        id: 3,
        name: 'Node 3',
        tags: ['No Tags'],
        links: []
      }
    ],
    links: [
      {
        source: 1,
        target: 2,
        how: 'a'
      },
      {
        source: 2,
        target: 3,
        how: 'a'
      },
      {
        source: 1,
        target: 3,
        how: 'a'
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
        tags: ['No Tags'],
        links: []
      },
      {
        id: 4,
        name: 'Node 4',
        tags: ['No Tags'],
        links: []
      }
    ],
    links: [
      {
        source: 1,
        target: 2,
        how: 'a'
      },
      {
        source: 1,
        target: 4,
        how: 'a'
      },
      {
        source: 2,
        target: 3,
        how: 'a'
      },
      {
        source: 3,
        target: 4,
        how: 'a'
      }
    ]
  }
];

export { scenarios };
