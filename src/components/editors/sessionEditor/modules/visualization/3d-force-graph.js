import $ from 'jquery';
import ForceGraph3D from '3d-force-graph';

export function ForceGraphVis(domElement) {
  let graph = ForceGraph3D({ width: 500 });
  graph(domElement);
  graph.d3Force('charge').strength(-150);
  graph.nodeColor(node => (node.id == 'id1' || node.id == 'id2') ? 'red' : 'blue');
  graph.backgroundColor('#19181A');
  
  let resizeForceGraph = function() {
      let width = parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
      let height = parseInt($('#side-bar').css('height'));
      graph.width(width).height(height);
  };

  $(window).resize(resizeForceGraph);
  resizeForceGraph();

  return function(dataset) {
    function addNodes(data) {
      const { nodes } = graph.graphData();
      let newNodes = [], newLinks = [];
      data.forEach(((node) => {
        newNodes.push({ id: node.id, name: node.name, val: 0 });
      }));
      newNodes.forEach((node, index) => {
        if (index < newNodes.length - 1) {
          newLinks.push({ source: node.id, target: newNodes[index + 1].id });
        }
      });
      newLinks.push({ source: 'id1', target: newNodes[0].id }, {
        source: newNodes[newNodes.length - 1].id,
        target: 'id2'
      });
      graph.graphData({ nodes: [...nodes, ...newNodes], links: newLinks });
    }

    dataset.nodes.forEach((node) => {
      node.val = 0;
    });
    graph.graphData(dataset);
    graph.linkDirectionalArrowLength(4);
    graph.linkDirectionalArrowRelPos(1);
    graph.linkCurvature(0.25);
    // if (dataset.interactions.length > 0) {
    //   addNodes(dataset.interactions);
    // }

    return graph;
  };
}