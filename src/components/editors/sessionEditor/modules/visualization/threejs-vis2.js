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

  getMixedLevelName(node) {
    if (node.tags.length == 0) {
      return '';
    } else if (node.tags.length == 1) {
      return node.tags[0];
    } else {
      let tag = '';
      node.tags.sort().forEach(el => {
        tag = tag + ' | ' + el;
      });
      tag = tag.slice(3);
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
    dataset.nodes.forEach(node => {
      if (node.tags.length > 1) {
        tag = this.getMixedLevelName(node);
      } else {
        tag = node.tags[0];
      }
      if (!tags.includes(tag)) {
        this.addToStructure(tag);
        tags.push(tag);
      }
      this.meshes.find(el => el.userData.id == node.id).userData.level = tag;
    });

    let counter = 0,
      temp = 0;
    this.structure.forEach(el => {
      if (el.id == 'No Tag') {
        temp = 0;
      } else {
        temp = counter;
      }
      this.meshes.forEach(el2 => {
        if (el2.userData.level == el.id) {
          el.content.push(el2);
          this.setLevelDepth(el.id, -this.layerStepSize * temp);
          this.moveTo(el2, -this.layerStepSize * temp);
          el2.material.color.set(el.color);
        }
      });
      counter++;
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
