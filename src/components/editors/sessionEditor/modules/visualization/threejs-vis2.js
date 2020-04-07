import * as THREE from 'three';
import $ from 'jquery';
import { LayeredGraphScene } from './threejs-lg-scene';
import { randomHexColor } from '../utils';

export class Visualization2 extends LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'TAGS';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor because in the future the bahavior of this visualization might need tweaking
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

  /*
   * Either returns 1) no tag   2) the single tag   3) a combination of all tags with " | " between them
   */
  getFormattedLayerName(node) {
    if (node.tags.length == 0) {
      return '';
    } else if (node.tags.length == 1) {
      return node.tags[0];
    } else {
      let tag = '';
      node.tags.sort().forEach(el => {
        tag = tag + ' | ' + el;
      });
      tag = tag.slice(3); //cuts of first " | "
      return tag;
    }
  }

  /*
   * This creates all the layers. In this case every Tag (combination of tags) gets its own layer
   */
  setupStructure(dataset) {
    this.structure = [];
    let tags = [],
      tag = '';

    //go through all nodes and their tags and add them structure of the graph
    //which means adding a new layer for each individual getFormattedLayerName()
    dataset.nodes.forEach(node => {
      if (node.tags.length > 1) {
        tag = this.getFormattedLayerName(node);
      } else {
        tag = node.tags[0];
      }
      if (!tags.includes(tag)) {
        this.addToStructure(tag);
        tags.push(tag);
      }
      this.meshes.find(el => el.userData.id == node.id).userData.level = tag;
    });

    //All the stuff from here on in this method is just to position all the layers
    //relative to the center (z-coord=0)
    let tempStr = {};
    let temp1 = 1,
      temp2 = 0;

    let addToTemp = (id, counter) => {
      if (!(id in tempStr)) {
        tempStr[id] = counter;
      }
    };

    //Find out how many layers there are (n) and count them from 0 to n
    //The order here reflects the layers' order on the z-axis
    this.structure.forEach(el => {
      if (el.id in tempStr) {
        return;
      }
      if (el.id == 'No Tags') {
        temp2 = 0;
      } else {
        temp2 = temp1;
        temp1++;
      }
      addToTemp(el.id, temp2);
    });

    //Now calc temp1 which decides how far back each layer gets shifted
    temp2 = Object.keys(tempStr).length;
    if (temp2 % 2 == 0) {
      //with an even number of layers they have to be shifted unevenly (no layer can be at z-coord=0)
      temp1 = this.layerStepSize / 2 + (temp2 / 2 - 1) * this.layerStepSize;
    } else {
      //with an uneven number of layers they have to be shifted evenly (one layer can be at z-coord=0)
      temp1 = Math.floor(temp2 / 2) * this.layerStepSize;
    }

    temp1 *= -1;

    //actually put every layer on it's real depth (z-coord)
    this.structure.forEach(el => {
      temp2 = tempStr[el.id] * this.layerStepSize + temp1; //Shift each layer back by it's index and
      //the space in between each layer

      this.meshes.forEach(el2 => {
        if (el2.userData.level == el.id) {
          el.content.push(el2);
          this.setLevelDepth(el.id, temp2);
          this.moveTo(el2, temp2);
          el2.material.color.set(el.color);
        }
      });
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
    if (keyCode == 88) {
      //X-button for front view
      this.orbitControls.reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      //Y-button for side view on layers
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      showViewLabel('Y');
    }
  }
}
