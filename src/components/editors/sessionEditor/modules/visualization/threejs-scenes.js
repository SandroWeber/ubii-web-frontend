import * as THREE from 'three';
import $ from 'jquery';

export class SceneVisualization {
  constructor() {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);

    this.structure = [];
    this.locked = {x: false, y: false, z: false};
    this.guideline = null;
    this.oldPos;
    this.meshes = [];
    this.arrows = [];
    this.materials = [];
    this.selected = [];
    this.levels = [];
    this.intersects = null;
    this.same = false;
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
  }

  getScene() {
    return this.scene;
  }

  setupStructure(dataset) {
    throw new Error('Cannot call abstract method');
  }

  moveTo(position) {
    throw new Error('Cannot call abstract method');
  }

  drag(event) {
    throw new Error('Cannot call abstract method');
  }

  dragstart(event) {
    throw new Error('Cannot call abstract method');
  }

  dragend(event) {
    throw new Error('Cannot call abstract method');
  }

  detectLevel(level) {
    throw new Error('Cannot call abstract method');
  }

  setOutlinePass(outlinePass) {
    this.outlinePassReference = outlinePass;
  }

  setDragging(dragging) {
    this.isDragging = dragging;
    this.oldPos = (new THREE.Vector3()).copy(this.selected[0].position);
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

  manageGuideline(createNew) {
    if(this.guideline != null) {
      this.scene.remove(this.guideline);
      this.guideline = null;
    }
    if(createNew && this.isDragging) {
      let temp;
      if(this.locked.x) {
        temp = 1;
      } else if(this.locked.y) {
        temp = 2;
      } else {
        temp = 0;
      }
      if(temp != 0) {
        let material = new THREE.LineBasicMaterial({
          color: 0xffffff
        });
        let geometry = new THREE.Geometry();
        let x = [], y= [];
        if(temp == 1) {
          x.push(this.oldPos.x); x.push(this.oldPos.x);
          y.push(this.oldPos.y-100); y.push(this.oldPos.y+100);
        } else {
          x.push(this.oldPos.x-100); x.push(this.oldPos.x+100);
          y.push(this.oldPos.y); y.push(this.oldPos.y);
        }
        geometry.vertices.push(
          new THREE.Vector3(x[0], y[0], this.oldPos.z),
          new THREE.Vector3(x[1], y[1], this.oldPos.z),
        );

        this.guideline = new THREE.Line( geometry, material );
        this.scene.add(this.guideline);
      }
    }
  }
}