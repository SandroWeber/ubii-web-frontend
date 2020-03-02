import * as THREE from 'three';
import $ from 'jquery';
import { SceneVisualization } from './threejs-scenes';
import { translatedToMatrix, randomHexColor } from '../utils';

export class Visualization3 extends SceneVisualization {
  constructor(dataset, show) {
    super();
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.dataset = dataset;
    this.level = -1;
    this.show = show;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.locked.z = true;
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
          this.setLevelDepth(el.id, -1 * temp);
          this.moveTo(el2, -1 * temp);
          el2.material.color.set(el.color);
        }
      });
      counter++;
    });
  }

  dragstart(event, camera) {
    if (this.selected[0] == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.level = this.selected[0].position.z;
    this.setDragging(true);
    this.manageGuideline(true);
  }

  dragend(event) {
    this.changeArrow(event.object);
    if (this.same && this.oldPos.equals(this.selected[0].position)) {
      this.deselect();
      this.same = false;
    }
    this.setDragging(false);
    this.manageGuideline(false);
  }

  drag(event) {
    if (this.locked.x) {
      this.selected[0].position.x = this.oldPos.x;
    }
    if (this.locked.y) {
      this.selected[0].position.y = this.oldPos.y;
    }
    if (this.locked.z) {
      this.selected[0].position.z = this.oldPos.z;
    }
  }

  moveTo(node, level) {
    node.position.set(node.position.x, node.position.y, level);
    this.changeArrow(node);
  }

  switchSelect() {
    if (this.intersects.length == 0) {
      this.deselect();
    }
  }

  onKeyDown(event, controls, camera, showViewLabel) {
    let keyCode = event.which;
    if (keyCode == 88) {
      controls.reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      camera.position.set(-8, 0, 0);
      controls.update();
      showViewLabel('Y');
    } else if (keyCode == 81) {
      this.locked.x = !this.locked.x;
      this.locked.y = false;
      this.setDragging(true);
      this.manageGuideline(true);
    } else if (keyCode == 69) {
      this.locked.y = !this.locked.y;
      this.locked.x = false;
      this.setDragging(true);
      this.manageGuideline(true);
    }
  }
}
