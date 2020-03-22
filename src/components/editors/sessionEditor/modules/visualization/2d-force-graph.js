import $ from 'jquery';
import ForceGraph from 'force-graph';

export function twoDForceGraphVis(domElement) {
  let graph = ForceGraph({ width: 500 });
  graph(domElement);
  graph.d3Force('charge').strength(-800);
  graph.nodeColor(node =>
    node.id == 'id1' || node.id == 'id2' ? 'red' : 'blue'
  );
  graph.backgroundColor('#19181A');

  let resizeForceGraph = function() {
    let width =
      parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
    let height =
      parseInt($('#side-bar').css('height')) -
      parseInt($('#settings-container').css('height'));
    graph.width(width).height(height);
  };

  $(window).resize(resizeForceGraph);
  resizeForceGraph();

  return function(dataset) {
    dataset.nodes.forEach(node => {
      node.val = 0;
    });
    graph.linkWidth(2);
    graph.nodeRelSize(10);
    graph.linkColor(() => 'rgba(255,255,255,1)');
    graph.linkVisibility(true);
    graph.linkDirectionalArrowLength(12);
    graph.linkDirectionalArrowRelPos(1);
    graph.graphData(dataset);

    return graph;
  };
}
