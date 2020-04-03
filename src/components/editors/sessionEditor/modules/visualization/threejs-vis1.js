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

  dragstart(event) {
    this.orbitControls.enabled = false;
    if (this.selected == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.setDragging(true);
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

  onKeyDown(event, showViewLabel) {
    let keyCode = event.which;

    let move = (layer, pos, obj) => {
      if (
        obj.focusedLayer == '' &&
        obj.focusedLayer != layer &&
        obj.selected != null
      ) {
        obj.moveTo(obj.selected, pos * obj.layerStepSize);
        let find = obj.structure.find(
          el => el.id == obj.selected.userData.level
        );
        obj.showLayer(find.id, false);
        find.content.splice(
          find.content.findIndex(
            el => el.userData.id == obj.selected.userData.id
          ),
          1
        );
        obj.structure.find(el => el.id == layer).content.push(obj.selected);
        obj.selected.userData.level = layer;
        obj.selected.material.color.set(
          obj.structure.find(el => el.id == layer).color
        );
        obj.setSlimLayers(obj.slimLayers);
      }
    };

    if (keyCode == 88) {
      this.orbitControls.reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
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
