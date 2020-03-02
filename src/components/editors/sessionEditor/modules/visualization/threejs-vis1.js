import * as THREE from 'three';
import $ from 'jquery';
import { SceneVisualization } from './threejs-scenes';

export class Visualization1 extends SceneVisualization {
  constructor(dataset) {
    super();
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.dataset = dataset;
    this.level = -1;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure();
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
      this.setLevelDepth('Level ' + i, i - 5);
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
    if (this.selected[0] == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.setDragging(true);
    this.manageGuideline(true);
  }

  dragend(event) {
    this.changeArrow(event.object);
    if (this.level >= 0) {
      this.moveTo(this.level);
      this.level = -1;
    }
    if (this.same && this.oldPos.equals(this.selected[0].position)) {
      this.deselect();
      this.same = false;
    }
    this.setDragging(false);
    this.manageGuideline(false);
  }

  drag(event) {
    this.detectLevel();
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

  moveTo(level) {
    if (this.selected.length > 0) {
      this.selected[0].position.set(
        this.selected[0].position.x,
        this.selected[0].position.y,
        this.structure.find(el => el.id == 'Level ' + (level + 1)).depth
      );
      this.detectLevel(level);
      this.changeArrow(this.selected[0]);
      if (this.selected[0].userData.level != '') {
        this.deleteFromLevel(this.selected[0]);
      }
      this.addToLevel(this.selected[0], level);
    }
  }

  detectLevel(level) {
    let checkRange = nmbr => {
      let abs = Math.round(nmbr);
      return Math.abs(abs - nmbr) <= 0.15 ? abs : nmbr;
    };

    if (level == undefined) {
      let levels = [...Array(9).keys()].map(el => el - 4);
      let range = checkRange(this.selected[0].position.z);
      if (levels.includes(range)) {
        this.selected[0].material.color.set(this.structure[range + 4].color);
        this.level = range + 4;
      } else {
        this.selected[0].material.color.set(this.structure[4].color);
        this.level = -1;
        if (this.selected[0].userData.level != '') {
          this.deleteFromLevel(this.selected[0]);
        }
      }
    } else {
      this.selected[0].material.color.set(this.structure[level].color);
      this.level = -1;
    }
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
    } else if (keyCode == 49) {
      this.moveTo(0);
    } else if (keyCode == 50) {
      this.moveTo(1);
    } else if (keyCode == 51) {
      this.moveTo(2);
    } else if (keyCode == 52) {
      this.moveTo(3);
    } else if (keyCode == 53) {
      this.moveTo(4);
    } else if (keyCode == 54) {
      this.moveTo(5);
    } else if (keyCode == 55) {
      this.moveTo(6);
    } else if (keyCode == 56) {
      this.moveTo(7);
    } else if (keyCode == 57) {
      this.moveTo(8);
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
