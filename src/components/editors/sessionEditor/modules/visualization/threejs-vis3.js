import * as THREE from 'three';
import $ from 'jquery';
import { LayeredGraphScene } from './threejs-lg-scene';
import { translatedToMatrix, randomHexColor } from '../utils';

export class Visualization3 extends LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'DEGREE';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor because in the future the bahavior of this visualization might need tweaking
    this.show = settings.sorting;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

  /*
   * This creates all the layers. In this case every incoming / outgoing / both (depending on this.show) degree gets its own layer
   */
  setupStructure(dataset) {
    this.structure = [];
    let matrix = translatedToMatrix(dataset);
    let levels = [],
      level = '',
      temp = 0;
    if (this.show == 0) {
      dataset.nodes.forEach((el1, index) => {
        temp = 0;
        matrix.forEach(el2 => {
          if (el2[index]) {
            temp++;
          }
        });
        level = temp + ' incoming Edge' + (temp == 1 ? '' : 's');
        if (!levels.includes(level)) {
          this.addToStructure(level);
          levels.push(level);
        }
        this.meshes.find(
          node => node.userData.id == dataset.nodes[index].id
        ).userData.level = level;
      });
    } else if (this.show == 1) {
      matrix.forEach((el1, index) => {
        temp = 0;
        el1.forEach(el2 => {
          if (el2) {
            temp++;
          }
        });
        level = temp + ' outgoing Edge' + (temp == 1 ? '' : 's');
        if (!levels.includes(level)) {
          this.addToStructure(level);
          levels.push(level);
        }
        this.meshes.find(
          node => node.userData.id == dataset.nodes[index].id
        ).userData.level = level;
      });
    } else if (this.show == 2) {
      dataset.nodes.forEach((el1, index) => {
        temp = 0;
        matrix.forEach(el2 => {
          if (el2[index]) {
            temp++;
          }
        });
        level = temp + ' incoming Edge' + (temp == 1 ? '' : 's');
        temp = 0;
        matrix[index].forEach(el2 => {
          if (el2) {
            temp++;
          }
        });
        level =
          level + ' | ' + temp + ' outgoing Edge' + (temp == 1 ? '' : 's');

        if (!levels.includes(level)) {
          this.addToStructure(level);
          levels.push(level);
        }
        this.meshes.find(
          node => node.userData.id == dataset.nodes[index].id
        ).userData.level = level;
      });
    }

    let counter = 0;
    this.structure.forEach(el => {
      temp = counter;
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
