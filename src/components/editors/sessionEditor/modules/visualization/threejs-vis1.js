import * as THREE from 'three';
import $ from 'jquery';
import { LayeredGraphScene } from './threejs-lg-scene';

export class Visualization1 extends LayeredGraphScene {
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
  setupStructure(dataset) {
    this.addToStructure('Level 1', '#CC0000');
    this.addToStructure('Level 2', '#D52E2E');
    this.addToStructure('Level 3', '#DC5454');
    this.addToStructure('Level 4', '#E27373');
    this.addToStructure('Level 5', '#ffffff');
    this.addToStructure('Level 6', '#7373D2');
    this.addToStructure('Level 7', '#5454C9');
    this.addToStructure('Level 8', '#2E2EBE');
    this.addToStructure('Level 9', '#0000B0');
    for (let i = 1; i < 10; i++) {
      this.setLevelDepth('Level ' + i, this.layerStepSize * (i - 5));
    }
    this.structure[4].content.push(...this.meshes);
    this.meshes.forEach(el => (el.userData.level = 'Level 5'));
  }

  /*
   * Function specific to Exploration Mode because a user can manually add layer to another node
   */
  addToLevel(node, level) {
    node.userData.level = 'Level ' + (level + 1);
    let index = this.structure.findIndex(el => el.id == 'Level ' + (level + 1));
    this.structure[index].content.push(node);
    this.hoverState(true, node);
    this.structure.splice(index, 1, this.structure[index]);
  }

  /*
   * Function specific to Exploration Mode because a user can manually delete node from layer
   */
  deleteFromLevel(node) {
    this.hoverState(false);
    let level = this.structure.find(el => el.id == node.userData.level);
    let index = level.content.findIndex(el => el == node);
    level.content.splice(index, 1);
    this.structure.splice(index, 1, this.structure[index]);
    node.userData.level = '';
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
  drag(event) {
    this.dragBehaviour();
    //If visualization-specific stuff has to happend during drag, put it here
  }

  /*
   * Method for handling keypresses
   */
  onKeyDown(event, showViewLabel) {
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
          el => el.id == obj.selected.userData.level
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
        obj.selected.userData.level = layer;
        obj.selected.material.color.set(
          obj.structure.find(el => el.id == layer).color
        );
        obj.setSlimLayers(obj.slimLayers); //maybe a layer has to resize if it gets a new node
      }
    };

    if (keyCode == 88) {
      //X-button for front view
      this.orbitControls.reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      //Y-button for side view on layers
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      showViewLabel('Y');
    } else if (keyCode == 49) {
      move('Level 1', -4, this);
    } else if (keyCode == 50) {
      move('Level 2', -3, this);
    } else if (keyCode == 51) {
      move('Level 3', -2, this);
    } else if (keyCode == 52) {
      move('Level 4', -1, this);
    } else if (keyCode == 53) {
      move('Level 5', 0, this);
    } else if (keyCode == 54) {
      move('Level 6', 1, this);
    } else if (keyCode == 55) {
      move('Level 7', 2, this);
    } else if (keyCode == 56) {
      move('Level 8', 3, this);
    } else if (keyCode == 57) {
      move('Level 9', 4, this);
    }
  }
}
