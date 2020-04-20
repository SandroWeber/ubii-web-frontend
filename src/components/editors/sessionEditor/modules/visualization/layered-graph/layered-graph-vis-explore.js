import * as THREE from 'three';
import { LayeredGraphScene } from './layered-graph-scene';

export class LayeredGraphVisExplore extends LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'EXPLORATION';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor because in the future the bahavior of this visualization might need tweaking
    this.createDataPoints();
    this.createLinks();
    this.setupStructure();
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

  /*
   * This creates all the layers. In this case always 9. All nodes stay on Layer 5 at first.
   */
  setupStructure() {
    this.addToStructure('Layer 1', '#CC0000');
    this.addToStructure('Layer 2', '#D52E2E');
    this.addToStructure('Layer 3', '#DC5454');
    this.addToStructure('Layer 4', '#E27373');
    this.addToStructure('Layer 5', '#ffffff');
    this.addToStructure('Layer 6', '#7373D2');
    this.addToStructure('Layer 7', '#5454C9');
    this.addToStructure('Layer 8', '#2E2EBE');
    this.addToStructure('Layer 9', '#0000B0');

    //right now layer planes are all on z=0

    for (let i = 1; i < 10; i++) {
      //put the different layer planes on their respective z-position
      this.setLayerDepth('Layer ' + i, this.layerStepSize * (i - 5));
    }

    this.structure[4].content.push(...this.meshes);
    this.meshes.forEach(el => (el.userData.layer = 'Layer 5'));
  }

  /*
   * Function specific to Exploration Mode because a user can manually add layer to another node
   */
  addToLayer(node, layer) {
    node.userData.layer = 'Layer ' + (layer + 1);
    let index = this.structure.findIndex(el => el.id == 'Layer ' + (layer + 1));
    this.structure[index].content.push(node);
    this.hoverState(true, node);
    this.structure.splice(index, 1, this.structure[index]);
  }

  /*
   * Function specific to Exploration Mode because a user can manually delete node from layer
   */
  deleteFromLayer(node) {
    this.hoverState(false);
    let layer = this.structure.find(el => el.id == node.userData.layer);
    let index = layer.content.findIndex(el => el == node);
    layer.content.splice(index, 1);
    this.structure.splice(index, 1, this.structure[index]);
    node.userData.layer = '';
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
  dragend(event) {
    this.orbitControls.enabled = true;
    this.changeArrow(event.object);
    if (this.same && this.oldPos.equals(this.selected.position)) {
      //If the user only clicked on a node (oldPos the same) just deselect
      this.deselect();
      this.same = false;
    } else if (!this.oldPos.equals(this.selected.position)) {
      //If node actually got dragged somewhere else put it back on the grid
      this.deleteNodeFromGrid(event.object);
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

    let move = (layer, pos, obj) => {
      if (
        obj.focusedLayer == '' &&
        obj.focusedLayer != layer &&
        obj.selected != null
      ) {
        //Only move a node to a layer that is visible (no layer is focused right now) and that is not the same layer
        obj.moveTo(obj.selected, pos * obj.layerStepSize);
        let find = obj.structure.find(
          el => el.id == obj.selected.userData.layer
        );
        obj.showLayer(find.id, false);

        //delete node from previous layer
        find.content.splice(
          find.content.findIndex(
            el => el.userData.id == obj.selected.userData.id
          ),
          1
        );
        obj.structure.find(el => el.id == layer).content.push(obj.selected); //put node into new layer
        obj.selected.userData.layer = layer;
        obj.selected.material.color.set(
          obj.structure.find(el => el.id == layer).color
        );
        obj.setSlimLayers(obj.slimLayers); //maybe a layer has to resize if it gets a new node
      }
    };

    if (keyCode == 88) {
      //X-button for front view
      this.orbitControls.reset();
      this.showViewLabel('X');
    } else if (keyCode == 89) {
      //Y-button for side view on layers
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      this.showViewLabel('Y');
    } else if (keyCode == 49) {
      move('Layer 1', -4, this);
    } else if (keyCode == 50) {
      move('Layer 2', -3, this);
    } else if (keyCode == 51) {
      move('Layer 3', -2, this);
    } else if (keyCode == 52) {
      move('Layer 4', -1, this);
    } else if (keyCode == 53) {
      move('Layer 5', 0, this);
    } else if (keyCode == 54) {
      move('Layer 6', 1, this);
    } else if (keyCode == 55) {
      move('Layer 7', 2, this);
    } else if (keyCode == 56) {
      move('Layer 8', 3, this);
    } else if (keyCode == 57) {
      move('Layer 9', 4, this);
    }
  }
}
