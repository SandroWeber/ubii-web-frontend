import $ from 'jquery';
import ForceGraph3D from '3d-force-graph';

export function ForceGraphVis3D(domElement, change) {
  let graph = ForceGraph3D({ width: 500 });
  graph(domElement[0]);
  graph.d3Force('charge').strength(-150);
  graph.nodeColor(node =>
    node.id == 'id1' || node.id == 'id2' ? 'red' : 'blue'
  );
  graph.backgroundColor('#19181A');

  let resizeForceGraph = function () {
    let width =
      parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
    let height =
      parseInt($('#side-bar').css('height')) -
      parseInt($('#settings-container').css('height'));
    graph.width(width).height(height);
  };

  $(window).resize(resizeForceGraph);
  resizeForceGraph();

  return function (dataset) {
    dataset.nodes.forEach(node => {
      node.val = 0;
    });
    graph.graphData(dataset);
    graph.linkColor(() => 'rgba(255,255,255,1)');
    graph.linkDirectionalArrowLength(4);
    graph.linkDirectionalArrowRelPos(1);
    graph.onNodeHover(node => {
      if (node != null) {
        change('viewNode', node.id);
      } else {
        change('viewNode', -1);
      }
    });
    return graph;
  };
}
