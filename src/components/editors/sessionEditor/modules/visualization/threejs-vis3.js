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

  getMixedTag(node) {
    if(node.tags.length == 0) {
      return '';
    } else if(node.tags.length == 1) {
      return node.tags[0];
    } else {
      let tag = "";
      node.tags.sort().forEach((el) => {
        tag = tag + ' | ' + el;
      });
      tag = tag.slice(3);
      return tag;
    }
  }

  setupStructure(dataset) {
    this.structure = [];
    let matrix = translatedToMatrix(dataset);
    let tags = [], tag = "", temp = 0;
    if(this.show == 0) {
      dataset.nodes.forEach((el1, index) => {
        temp = 0;
        matrix.forEach(el2 => {
          if(el2[index]) {
            temp++;
          }
        });
        tag = temp + " incoming Edges";
        if(!tags.includes(tag)) {
          this.structure.push({id: tag, color: randomHexColor(), content: []});
          tags.push(tag);
        }
        this.meshes.find(node => node.userData.id == dataset.nodes[index].id).userData.tag = tag;
      });
    } else if(this.show == 1) {
      matrix.forEach((el1, index) => {
        temp = 0;
        el1.forEach(el2 => {
          if(el2) {
            temp++;
          }
        });
        tag = temp + " outgoing Edges";
        if(!tags.includes(tag)) {
          this.structure.push({id: tag, color: randomHexColor(), content: []});
          tags.push(tag);
        }
        this.meshes.find(node => node.userData.id == dataset.nodes[index].id).userData.tag = tag;
      });
    }  else if(this.show == 2) {
      dataset.nodes.forEach((el1, index) => {
        temp = 0;
        matrix.forEach(el2 => {
          if(el2[index]) {
            temp++;
          }
        });
        tag = temp + " incoming Edges";
        temp = 0;
        matrix[index].forEach(el2 => {
          if(el2) {
            temp++;
          }
        });
        tag = tag + " | " + temp + " outgoing Edges";

        if(!tags.includes(tag)) {
          this.structure.push({id: tag, color: randomHexColor(), content: []});
          tags.push(tag);
        }
        this.meshes.find(node => node.userData.id == dataset.nodes[index].id).userData.tag = tag;
      });
    }

    let counter = 0;
    this.structure.forEach(el => {
      temp = counter;
      this.meshes.forEach(el2 => {
        if(el2.userData.tag == el.id) {
          el.content.push(el2);
          this.moveTo(el2, (-1) * temp);
          el2.material.color.set(el.color);
        }
      });
      counter++;
    });
  }

  addTag(node, tag) {
    node.userData.tag = 'Level '+(tag+1);
    let index = this.structure.findIndex(el => el.id == 'Level '+(tag+1));
    this.structure[index].content.push(node);
    this.structure.splice(index, 1, this.structure[index]);
  }

  deleteTag(node) {
    let tag = this.structure.find(el => el.id == node.userData.tag);
    let index = tag.content.findIndex(el => el == node);
    tag.content.splice(index, 1);
    this.structure.splice(index, 1, this.structure[index]);
    node.userData.tag = '';
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
    if(this.locked.x) {
      this.selected[0].position.x = this.oldPos.x;
    }
    if(this.locked.y) {
      this.selected[0].position.y = this.oldPos.y;
    }
    if(this.locked.z) {
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
  update(mouse, camera) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);

    if (this.intersects.length > 0) {
      obj = this.intersects[0].object;
      node = this.meshes.find(el => el == obj);
      this.nodeLabel.show();
      this.nodeLabel.html('Name: ' + node.name + '<br /> Tag: ' + node.userData.tag);
    } else {
      this.nodeLabel.hide();
    }
  }
}
