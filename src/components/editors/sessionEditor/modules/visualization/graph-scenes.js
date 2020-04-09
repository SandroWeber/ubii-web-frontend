import { LGVisualization1 } from './layered-graph/threejs-lg-vis1';
import { LGVisualization2 } from './layered-graph/threejs-lg-vis2';
import { LGVisualization3 } from './layered-graph/threejs-lg-vis3';
import { LGVisualization4 } from './layered-graph/threejs-lg-vis4';

import { GGVisualization1 } from './grouped-graph/threejs-gg-vis1';

let Visualizations = [
  {
    type: 'LAYERED',
    scenes: [
      { id: 'EXPLORATION', scene: LGVisualization1 },
      { id: 'TAGS', scene: LGVisualization2 },
      { id: 'DEGREE', scene: LGVisualization3 },
      { id: 'STEPS', scene: LGVisualization4 }
    ]
  },
  { type: 'GROUPED', scenes: [{ id: 'MANUAL', scene: GGVisualization1 }] }
];

export { Visualizations };
