import { LayeredGraphVisExplore } from './layered-graph/layered-graph-vis-explore';
import { LayeredGraphVisTags } from './layered-graph/layered-graph-vis-tags';
import { LayeredGraphVisDegree } from './layered-graph/layered-graph-vis-degree';
import { LayeredGraphVisSteps } from './layered-graph/layered-graph-vis-steps';

import { GGVisualization1 } from './grouped-graph/threejs-gg-vis1';

let Visualizations = [
  {
    type: 'LAYERED',
    scenes: [
      { id: 'EXPLORATION', scene: LayeredGraphVisExplore },
      { id: 'TAGS', scene: LayeredGraphVisTags },
      { id: 'DEGREE', scene: LayeredGraphVisDegree },
      { id: 'STEPS', scene: LayeredGraphVisSteps }
    ]
  },
  { type: 'GROUPED', scenes: [{ id: 'MANUAL', scene: GGVisualization1 }] }
];

export { Visualizations };
