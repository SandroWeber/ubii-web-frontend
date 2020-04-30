import * as THREE from 'three';
import { LayeredGraphScene } from './layered-graph-scene';
import { translatedToMatrix } from '../../utils';

export class LayeredGraphVisSteps extends LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'STEPS';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor because in the future the bahavior of this visualization might need tweaking
    this.startNode = settings.startNode;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

  /*
   * This creates all the layers. In this case when starting from one node and stepping down every path,
   * every number of steps gets a layer.
   */
  setupStructure(dataset) {
    this.structure = [];
    let matrix = translatedToMatrix(dataset);
    let layers = [];

    //this function call actually does most of the job
    //which means traversing through the whole graph beginning at
    //the starting node
    //but may visit nodes multiple times (to get nearest distance for every node)
    this.recursiveGraphCheck(
      matrix,
      layers,
      0,
      dataset.nodes.findIndex(el => el.id == this.startNode)
    );

    let created = false;
    let depth = 0;
    let temp;
    this.structure.forEach(el => {
      if (el.depth > depth) {
        depth = el.depth;
      }
    });

    //because of possible multi-visiting of nodes some more stuff
    //has to happen now to get the final result:

    //all the nodes that haven't been visited yet belong in the "Unreachable" state
    depth /= this.layerStepSize;
    depth++;
    this.meshes.forEach(el => {
      if (el.userData.layer == undefined) {
        //check if nodes doesn't haven "step count" yet which means it can't be reach
        //from Starting node
        if (!created) {
          this.addToStructure('Unreachable');
          created = true;
        }

        this.setLayerDepth('Unreachable', this.layerStepSize * depth);

        temp = this.structure.find(el2 => el2.id == 'Unreachable');

        temp.content.push(el); //fill "Unreachable" layer with all leftover nodes

        el.material.color.set(temp.color);
        this.moveTo(el, this.layerStepSize * depth);

        el.userData.layer = 'Unreachable';
      }
    });

    //now clear up all of the nodes that have been visited multiple times
    //every node's layer is  set to the one with the minimal amount of steps
    //so clear this node from all the other layers' contents
    //and just leave it in the one where it actually belongs
    let del = [];
    this.structure.forEach(el => {
      //go through every "X amounts of steps"-layer

      temp = []; //arraya of nodes who have to be cut from the current layer
      //because they don't belong there (becaue there is a shorter way)

      el.content.forEach(el2 => {
        //go through every node on that layer
        if (el2.userData.layer != el.id) {
          //only if this node's designated layer isn't the same
          //as this one
          temp.push(el2);
        }
      });

      //now delete all the nodes that don't belong on this layer
      temp.forEach(el2 => {
        el.content.splice(
          el.content.findIndex(el3 => el3.userData.layer == el2.userData.layer),
          1
        );
      });

      //if by deleting nodes this layer becomes obsolete -> put it in delete array
      if (el.content.length == 0) {
        del.push(el.id);
      }
    });

    //go through delete array (all layers that became obsolete after previous step)
    //and delete these layer
    //cannot be done in the same steps as above because cannot splice in array
    //while traversing it
    del.forEach(el => {
      let find = this.structure.find(el2 => el2.id == el);
      this.scene.remove(find.plane.p);

      //delete all border lines
      find.plane.b.forEach(el2 => {
        this.scene.remove(el2);
      });

      //delete all grid lines
      find.plane.g.forEach(el2 => {
        this.scene.remove(el2);
      });

      temp = this.structure.findIndex(el2 => el2.id == el);
      this.structure.splice(temp, 1);
    });

    this.centerLayersIn3D(false, 'Unreachable'); //this centers all layer on z-axis
  }

  /*
   * Intermediate function to call on every node while traversing the array
   */
  recursiveGraphCheck(matrix, layers, counter, index) {
    let layer = counter + ' step' + (counter == 1 ? '' : 's');
    if (layer == '0 steps') {
      layer += ' (start)';
    }
    if (!layers.includes(layer)) {
      //if layer with this amounts of steps doesn't exist yet create it
      layers.push(layer);
      this.addToStructure(layer);
    }

    this.meshes[index].userData.layer = layer;
    let l = this.structure.find(el => el.id == layer);
    let found = l.content.find(
      el => el.userData.id == this.meshes[index].userData.id
    );

    if (found == undefined) {
      l.content.push(this.meshes[index]);
    }

    let temp = counter + 1;
    this.meshes[index].material.color.set(l.color);

    //calling method on every node kinda like BFS
    matrix[index].forEach((el, index2) => {
      if (el) {
        this.recursiveGraphCheck(matrix, layers, temp, index2);
      }
    });
  }

  /*
   * Method for handling the start of a dragging operation.
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior on dragstart
   */
  dragstart(event) {
    this.orbitControls.enabled = false;
    if (this.selected == event.object) {
      //If the dragged node is the same one that is already selected
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.setDragging(true);
  }

  /*
   * Method for handling the end of a dragging operation.
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior on dragend
   */
  dragend() {
    this.orbitControls.enabled = true;
    this.changeArrow(this.selected);
    if (this.same && this.oldPos.equals(this.selected.position)) {
      //If the user only clicked on a node (oldPos the same) just deselect
      this.deselect();
      this.same = false;
    } else if (!this.oldPos.equals(this.selected.position)) {
      //If node actually got dragged somewhere else put it back on the grid
      this.deleteNodeFromGrid(this.selected);
      this.checkNodePositionOnGrid(this.selected);
    }
    this.setSlimLayers(this.slimLayers); //maybe a layer has to resize if a node got dragged around
    this.isDragging = false;
  }

  /*
   * Method for handling the behavior during a dragging operation
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior while dragging
   */
  drag() {
    this.dragBehaviour();
    //If visualization-specific stuff has to happend during drag, put it here
  }

  /*
   * Method for handling keypresses
   */
  onKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 88) {
      //X-button for front view
      this.orbitControls.reset();
    } else if (keyCode == 89) {
      //Y-button for side view on layers
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
    }
  }
}
