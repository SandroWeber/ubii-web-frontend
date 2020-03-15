import * as THREE from 'three';
import $ from 'jquery';
import { SceneVisualization } from './threejs-scenes';
import { translatedToMatrix, randomHexColor } from '../utils';

export class Visualization4 extends SceneVisualization {
  constructor(dataset, snapToGrid, startNode) {
    super(dataset, snapToGrid);
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.startNode = startNode;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
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
        this.moveTo(el, depth);
        el.userData.level = 'Unreachable';
      }
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
    l.content.push(this.meshes[index]);
    this.meshes[index].material.color.set(l.color);
    let temp = counter + 1;
    matrix[index].forEach((el, index2) => {
      if (el) {
        this.recursiveGraphCheck(matrix, levels, dataset, temp, index2);
      }
    });
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
    }
    this.setSlimLayers(this.slimLayers);
    this.setDragging(false);
    this.manageGuideline(false);
  }

  drag(event) {
    this.dragBehaviour();
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
