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
    this.show = settings.sorting;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

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

  dragstart(event) {
    this.orbitControls.enabled = false;
    if (this.selected == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.setDragging(true);
    this.manageGuideline(true);
  }

  dragend(event) {
    this.orbitControls.enabled = true;
    this.changeArrow(event.object);
    if (this.same && this.oldPos.equals(this.selected.position)) {
      this.deselect();
      this.same = false;
    } else if (!this.oldPos.equals(this.selected.position)) {
      this.deleteNodeFromGrid(event.object);
      this.checkNodePositionOnGrid(this.selected);
    }
    this.setSlimLayers(this.slimLayers);
    this.isDragging = false;
    this.manageGuideline(false);
  }

  drag(event) {
    this.dragBehaviour();
  }

  onKeyDown(event, showViewLabel) {
    let keyCode = event.which;
    if (keyCode == 88) {
      this.orbitControls.reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      showViewLabel('Y');
    }
  }
}
