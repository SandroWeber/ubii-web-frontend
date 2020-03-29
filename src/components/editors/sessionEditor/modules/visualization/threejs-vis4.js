import * as THREE from 'three';
import $ from 'jquery';
import { LayeredGraphScene } from './threejs-scenes';
import { translatedToMatrix, randomHexColor } from '../utils';

export class Visualization4 extends LayeredGraphScene {
  constructor(dataset, settings, renderer) {
    super(dataset, settings, renderer);
    this.id = 'STEPS';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
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
    let levels = [];
    this.recursiveGraphCheck(
      matrix,
      levels,
      dataset,
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
    depth /= this.layerStepSize;
    depth++;
    this.meshes.forEach(el => {
      if (el.userData.level == undefined) {
        if (!created) {
          this.addToStructure('Unreachable');
          created = true;
        }
        this.setLevelDepth('Unreachable', this.layerStepSize * depth);
        temp = this.structure.find(el2 => el2.id == 'Unreachable');
        temp.content.push(el);
        el.material.color.set(temp.color);
        this.moveTo(el, this.layerStepSize * depth);
        el.userData.level = 'Unreachable';
      }
    });
    let del = [];
    this.structure.forEach(el => {
      temp = [];
      el.content.forEach(el2 => {
        if (el2.userData.level != el.id) {
          temp.push(el2);
        }
      });
      temp.forEach(el2 => {
        el.content.splice(
          el.content.findIndex(el3 => el3.userData.level == el2.userData.level),
          1
        );
      });
      if (el.content.length == 0) {
        del.push(el.id);
      }
    });
    del.forEach(el => {
      let find = this.structure.find(el2 => el2.id == el);
      this.scene.remove(find.plane.p);
      find.plane.b.forEach(el2 => {
        this.scene.remove(el2);
      });
      find.plane.g.forEach(el2 => {
        this.scene.remove(el2);
      });
      temp = this.structure.findIndex(el2 => el2.id == el);
      this.structure.splice(temp, 1);
    });
  }

  recursiveGraphCheck(matrix, levels, dataset, counter, index) {
    let level = counter + ' step' + (counter == 1 ? '' : 's');
    if (!levels.includes(level)) {
      levels.push(level);
      this.addToStructure(level);
    }
    this.meshes[index].userData.level = level;
    this.setLevelDepth(level, this.layerStepSize * counter);
    this.moveTo(this.meshes[index], this.layerStepSize * counter);
    let l = this.structure.find(el => el.id == level);
    let found = l.content.find(
      el => el.userData.id == this.meshes[index].userData.id
    );
    if (found == undefined) {
      l.content.push(this.meshes[index]);
    }
    if (index == 3 && level == '2 steps') {
      console.log('here');
    }
    let temp = counter + 1;
    this.meshes[index].material.color.set(l.color);
    matrix[index].forEach((el, index2) => {
      if (el) {
        this.recursiveGraphCheck(matrix, levels, dataset, temp, index2);
      }
    });
  }

  dragstart(event) {
    if (this.selected == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.setDragging(true);
    this.manageGuideline(true);
  }

  dragend(event) {
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
      this.controls[0].reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      this.camera.position.set(-8, 0, 0);
      this.controls[0].update();
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
