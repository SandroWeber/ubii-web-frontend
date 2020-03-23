import * as THREE from 'three';
import $ from 'jquery';
import { SceneVisualization } from './threejs-scenes';

export class Visualization1 extends SceneVisualization {
  constructor(dataset, snapToGrid) {
    super(dataset, snapToGrid);
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.createDataPoints();
    this.createLinks();
    this.setupStructure();
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

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

  addToLevel(node, level) {
    node.userData.level = 'Level ' + (level + 1);
    let index = this.structure.findIndex(el => el.id == 'Level ' + (level + 1));
    this.structure[index].content.push(node);
    this.hoverState(true, node);
    this.structure.splice(index, 1, this.structure[index]);
  }

  deleteFromLevel(node) {
    this.hoverState(false);
    let level = this.structure.find(el => el.id == node.userData.level);
    let index = level.content.findIndex(el => el == node);
    level.content.splice(index, 1);
    this.structure.splice(index, 1, this.structure[index]);
    node.userData.level = '';
  }

  dragstart(event, camera) {
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
    this.setDragging(false);
    this.manageGuideline(false);
  }

  drag(event) {
    this.dragBehaviour();
  }

  detectLevel(level) {
    let checkRange = nmbr => {
      let abs = Math.round(nmbr);
      return Math.abs(abs - nmbr) <= 0.15 ? abs : nmbr;
    };

    if (level == undefined) {
      let levels = [...Array(9).keys()].map(
        el => (el - 4) * this.layerStepSize
      );
      let range = checkRange(this.selected.position.z);
      if (levels.includes(range)) {
        range = range / this.layerStepSize;
        this.selected.material.color.set(this.structure[range + 4].color);
      } else {
        this.selected.material.color.set(this.structure[4].color);
        if (this.selected.userData.level != '') {
          this.deleteFromLevel(this.selected);
        }
      }
    } else {
      this.selected.material.color.set(this.structure[level].color);
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
    } else if (keyCode == 49) {
      this.moveTo(this.selected, -4 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 1').content.push(this.selected);
      this.selected.userData.level = 'Level 1';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 50) {
      this.moveTo(this.selected, -3 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 2').content.push(this.selected);
      this.selected.userData.level = 'Level 2';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 51) {
      this.moveTo(this.selected, -2 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 3').content.push(this.selected);
      this.selected.userData.level = 'Level 3';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 52) {
      this.moveTo(this.selected, -1 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 4').content.push(this.selected);
      this.selected.userData.level = 'Level 4';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 53) {
      this.moveTo(this.selected, 0 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 5').content.push(this.selected);
      this.selected.userData.level = 'Level 5';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 54) {
      this.moveTo(this.selected, 1 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 6').content.push(this.selected);
      this.selected.userData.level = 'Level 6';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 55) {
      this.moveTo(this.selected, 2 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 7').content.push(this.selected);
      this.selected.userData.level = 'Level 7';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 56) {
      this.moveTo(this.selected, 3 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 8').content.push(this.selected);
      this.selected.userData.level = 'Level 8';
      this.setSlimLayers(this.slimLayers);
    } else if (keyCode == 57) {
      this.moveTo(this.selected, 4 * this.layerStepSize);
      this.structure.find(el => el.id == 'Level 9').content.push(this.selected);
      this.selected.userData.level = 'Level 9';
      this.setSlimLayers(this.slimLayers);
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
