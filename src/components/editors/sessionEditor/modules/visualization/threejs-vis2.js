import * as THREE from 'three';
import $ from 'jquery';
import { SceneVisualization } from './threejs-scenes';
import { randomHexColor } from '../utils';

export class Visualization2 extends SceneVisualization {
  constructor(dataset) {
    super();
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.dataset = dataset;
    this.meshes = [];
    this.arrows = [];
    this.materials = [];
    this.selected = [];
    this.levels = [];
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
    this.intersects = null;
    this.oldPos;
    this.same = false;
    this.level = -1;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.calcStructure(dataset);
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
    let tags = [], tag = "";
    dataset.nodes.forEach((node) => {
      if(node.tags.length > 1) {
        tag = this.getMixedTag(node);
        if(!tags.includes(tag)) {
          this.structure.push({id: tag, color: randomHexColor(), content: []});
          tags.push(tag);
        }
      } else if(node.tags.length == 1) {
        if(!tags.includes(node.tags[0])) {
          this.structure.push({id: node.tags[0], color: randomHexColor(), content: []});
          tags.push(node.tags[0]);
        }
      }
    });
  }

  calcStructure(dataset) {
    let counter = 1, temp = 0;
    this.structure.forEach(el => {
      if(el.id == 'No Tag') {
        temp = 0;
      } else {
        temp = counter;
      }
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

  createDataPoints() {
    let mesh, material;
    this.dataset.nodes.forEach((node) => {
      material = new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 0.8
      });
      this.materials.push(material);
      mesh = new THREE.Mesh(this.geometry, material);
      mesh.name = node.name;
      mesh.userData = { 'id': node.id, tag: this.getMixedTag(node) };
      this.meshes.push(mesh);
      mesh.position.set(THREE.Math.randFloat(-4, 4), THREE.Math.randFloat(-3, 3), 0);
      this.scene.add(mesh);
    });
  }

  setOutlinePass(outlinePass) {
    this.outlinePassReference = outlinePass;
  }

  createLinks() {
    this.dataset.links.forEach((link) => {this.createLink(link)});
  }

  createLink(link) {
    let arrow, dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == link.source).position;
    destination = this.meshes.find(el => el.userData.id == link.target).position;
    dir = new THREE.Vector3().subVectors(destination, origin);
    length = dir.length() - 0.2;
    arrow = new THREE.ArrowHelper(dir.normalize(), origin, 1, 0xffffff);
    arrow.setLength(length, 0.4, 0.1);
    this.arrows.push({ 'source': link.source, 'target': link.target, 'arrow': arrow });
    this.scene.add(arrow);
  }

  updateLink(arrowLink, source, target) {
    let dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == source).position;
    destination = this.meshes.find(el => el.userData.id == target).position;
    dir = new THREE.Vector3().subVectors(destination, origin);
    length = dir.length() - 0.2;
    arrowLink.position.copy(origin);
    arrowLink.setDirection(dir.normalize());
    arrowLink.setLength(length, 0.4, 0.1);

  }

  dragstart(event) {
    if (this.selected[0] == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.level = this.selected[0].position.z;
    this.oldPos = (new THREE.Vector3()).copy(this.selected[0].position);
  }

  dragend(event) {
    this.changeArrow(event.object);
    if (this.same && this.oldPos.equals(this.selected[0].position)) {
      this.deselect();
      this.same = false;
    }
  }

  drag(event) {
    this.selected[0].position.z = this.level;
  }

  changeArrow(mesh) {
    let id = (this.meshes.find(el => el == mesh)).userData.id;
    this.arrows.forEach(el => {
      if (el.source == id) {
        this.updateLink(el.arrow, id, el.target);
      } else if (el.target == id) {
        this.updateLink(el.arrow, el.source, id);
      }
    });
  }

  moveTo(node, level) {
    node.position.set(node.position.x, node.position.y, level);
    this.changeArrow(node);
  }

  detectLevel(level) {

  }

  updateLabelSpritePosition(x, y) {
    this.nodeLabel.css({ 'top': y, 'left': x + 30 });
  }

  select(node) {
    this.selected.push(node);
    this.outlinePassReference.selectedObjects = this.selected;
  }

  deselect() {
    if (this.selected.length > 0) {
      this.selected = [];
      this.outlinePassReference.selectedObjects = [];
    }
  }

  switchSelect() {
    if (this.intersects.length == 0) {
      this.deselect();
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
