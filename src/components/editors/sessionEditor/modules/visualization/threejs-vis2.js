import * as THREE from 'three';
import $ from 'jquery';
import { LayeredGraphScene } from './threejs-scenes';
import { randomHexColor } from '../utils';

export class Visualization2 extends LayeredGraphScene {
  constructor(dataset, settings, renderer) {
    super(dataset, settings, renderer);
    this.id = 'TAGS';
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
