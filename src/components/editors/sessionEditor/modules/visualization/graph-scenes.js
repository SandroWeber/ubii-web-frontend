import { Visualization1 } from './threejs-vis1';
import { Visualization2 } from './threejs-vis2';
import { Visualization3 } from './threejs-vis3';
import { Visualization4 } from './threejs-vis4';

import { GGVisualization1 } from './threejs-gg-vis1';

let Visualizations = [
  {
    type: 'LAYERED',
    scenes: [
      { id: 'EXPLORATION', scene: Visualization1 },
      { id: 'TAGS', scene: Visualization2 },
      { id: 'DEGREE', scene: Visualization3 },
      { id: 'STEPS', scene: Visualization4 }
    ]
  },
  { type: 'GROUPED', scenes: [{ id: 'BASIC', scene: GGVisualization1 }] }
];

export { Visualizations };
