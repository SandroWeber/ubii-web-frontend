import * as THREE from 'three';
import $ from 'jquery';
import Vue from 'vue';

class SceneVisualization {
  constructor() {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);
    this.structure = [];
  }

  getScene() {
    return this.scene;
  }

  calcStructure(dataset) {
    throw new Error('Cannot call abstract method');
  }
}

export class Visualization1 extends SceneVisualization {
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
    this.setupStructure();
    this.calcStructure(dataset);
  }

  setupStructure(dataset) {
    this.structure = [{id: 'Level 1', color: "#CC0000", content: []}, {id: 'Level 2', color: "#D52E2E", content: []}, {id: 'Level 3', color: "#DC5454", content: []}, {id: 'Level 4', color: "#E27373", content: []}, {id: 'Level 5', color: "#ffffff", content: []}, {id: 'Level 6', color: "#7373D2", content: []}, {id: 'Level 7', color: "#5454C9", content: []}, {id: 'Level 8', color: "#2E2EBE", content: []}, {id: 'Level 9', color: "#0000B0", content: []}];
  }

  calcStructure(dataset) {
    this.structure[4].content.push(...this.meshes);
    this.meshes.forEach(el => el.userData.tag = 'Level 5');
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
      mesh.userData = { 'id': node.id };
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
    this.oldPos = (new THREE.Vector3()).copy(this.selected[0].position);
  }

  dragend(event) {
    this.changeArrow(event.object);
    if (this.level >= 0) {
      this.moveToLevel(this.level);
      this.level = -1;
    }
    if (this.same && this.oldPos.equals(this.selected[0].position)) {
      this.deselect();
      this.same = false;
    }
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

  moveToLevel(level) {
    if (this.selected.length > 0) {
      this.selected[0].position.set(this.selected[0].position.x, this.selected[0].position.y, (level-4) * 1);
      this.detectLevel(level);
      this.changeArrow(this.selected[0]);
      if(this.selected[0].userData.tag != '') {
        this.deleteTag(this.selected[0]);
      }
      this.addTag(this.selected[0], level);
    }
  }

  detectLevel(level) {
    let checkRange = (nmbr) => {
      let abs = Math.round(nmbr);
      return Math.abs(abs - nmbr) <= 0.15 ? abs : nmbr;
    };

    if (level == undefined) {
      let levels = [...Array(9).keys()].map(el => el-4);
      let range = checkRange(this.selected[0].position.z);
      if (levels.includes(range)) {
        this.selected[0].material.color.set(this.structure[range+4].color);
        this.level = range+4;
      } else {
        this.selected[0].material.color.set(this.structure[4].color);
        this.level = -1;
        if(this.selected[0].userData.tag != '') {
          this.deleteTag(this.selected[0]);
        }
      }
    } else {
      this.selected[0].material.color.set(this.structure[level].color);
      this.level = -1;
    }
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
      this.nodeLabel.html(node.name);
    } else {
      this.nodeLabel.hide();
    }
  }
}