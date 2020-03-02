import * as THREE from 'three';
import $ from 'jquery';
import { randomHexColor } from '../utils';

export class SceneVisualization {
  constructor() {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);

    this.structure = [];
    this.locked = { x: false, y: false, z: false };
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
    this.stepSize = 1;
    this.steps = 4;
    this.hover = null;
    this.zero = {};
    this.createZeroMarker();
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
    this.oldPos = new THREE.Vector3().copy(this.selected[0].position);
  }

  hoverState(start, obj) {
    if (start) {
      this.hover = obj;
      this.nodeLabel.show();
      this.nodeLabel.html('Name: ' + obj.name);
      if (this.hover.userData.level != '') {
        this.structure.find(
          el => el.id == obj.userData.level
        ).plane.visible = true;
      }
    } else if (this.hover != null) {
      let level = this.hover.userData.level;
      this.hover = null;
      this.nodeLabel.hide();
      this.structure.find(el => el.id == level).plane.visible = false;
    }
  }

  addToStructure(id, color) {
    let c;
    if (color == undefined) {
      c = randomHexColor();
    } else {
      c = color;
    }
    let plane = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
    );
    plane.scale.x = this.steps * this.stepSize * 2;
    plane.scale.y = this.steps * this.stepSize * 2;
    plane.position.z;
    plane.visible = false;
    this.scene.add(plane);
    this.structure.push({
      id: id,
      color: c,
      content: [],
      plane: plane
    });
  }

  setLevelDepth(id, depth) {
    let find = this.structure.find(str => str.id == id);
    find.depth = depth;
    find.plane.position.z = depth;
  }

  createZeroMarker() {
    this.zero.circle = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 64, 64),
      new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
      })
    );
    let lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff
    });
    let geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(0.5, 0, 0)
    );
    this.zero.line1 = new THREE.Line(geometry, lineMat);
    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, -0.5, 0)
    );
    this.zero.line2 = new THREE.Line(geometry, lineMat);
    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, 0, -0.5),
      new THREE.Vector3(0, 0, 0.5)
    );
    this.zero.line3 = new THREE.Line(geometry, lineMat);
    this.scene.add(this.zero.circle);
    this.scene.add(this.zero.line1);
    this.scene.add(this.zero.line2);
    this.scene.add(this.zero.line3);
  }

  hideZeroMarker() {
    this.zero.circle.visible = false;
    this.zero.line1.visible = false;
    this.zero.line2.visible = false;
    this.zero.line3.visible = false;
  }

  showZeroMarker() {
    this.zero.circle.visible = true;
    this.zero.line1.visible = true;
    this.zero.line2.visible = true;
    this.zero.line3.visible = true;
  }

  createDataPoints() {
    let mesh, material;
    this.dataset.nodes.forEach(node => {
      material = new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 0.8
      });
      this.materials.push(material);
      mesh = new THREE.Mesh(this.geometry, material);
      mesh.name = node.name;
      mesh.userData = { id: node.id };
      this.meshes.push(mesh);
      mesh.position.set(
        THREE.Math.randFloat(-this.steps, this.steps),
        THREE.Math.randFloat(-this.steps, this.steps),
        0
      );
      this.scene.add(mesh);
    });
  }

  createLinks() {
    this.dataset.links.forEach(link => {
      this.createLink(link);
    });
  }

  createLink(link) {
    let arrow, dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == link.source).position;
    destination = this.meshes.find(el => el.userData.id == link.target)
      .position;
    dir = new THREE.Vector3().subVectors(destination, origin);
    length = dir.length() - 0.2;
    arrow = new THREE.ArrowHelper(dir.normalize(), origin, 1, 0xffffff);
    arrow.setLength(length, 0.4, 0.1);
    this.arrows.push({
      source: link.source,
      target: link.target,
      arrow: arrow
    });
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
    let id = this.meshes.find(el => el == mesh).userData.id;
    this.arrows.forEach(el => {
      if (el.source == id) {
        this.updateLink(el.arrow, id, el.target);
      } else if (el.target == id) {
        this.updateLink(el.arrow, el.source, id);
      }
    });
  }

  updateLabelSpritePosition(x, y) {
    this.nodeLabel.css({ top: y, left: x + 30 });
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
    if (this.guideline != null) {
      this.scene.remove(this.guideline);
      this.guideline = null;
    }
    if (createNew && this.isDragging) {
      let temp;
      if (this.locked.x) {
        temp = 1;
      } else if (this.locked.y) {
        temp = 2;
      } else {
        temp = 0;
      }
      if (temp != 0) {
        let material = new THREE.LineBasicMaterial({
          color: 0xffffff
        });
        let geometry = new THREE.Geometry();
        let x = [],
          y = [];
        if (temp == 1) {
          x.push(this.oldPos.x);
          x.push(this.oldPos.x);
          y.push(this.oldPos.y - 100);
          y.push(this.oldPos.y + 100);
        } else {
          x.push(this.oldPos.x - 100);
          x.push(this.oldPos.x + 100);
          y.push(this.oldPos.y);
          y.push(this.oldPos.y);
        }
        geometry.vertices.push(
          new THREE.Vector3(x[0], y[0], this.oldPos.z),
          new THREE.Vector3(x[1], y[1], this.oldPos.z)
        );

        this.guideline = new THREE.Line(geometry, material);
        this.scene.add(this.guideline);
      }
    }
  }

  makeLevelsSlim() {}

  makeLevelsWide() {
    this.structure.forEach(
      el => (el.plane.scale.x = this.steps * this.stepSize * 2)
    );
    this.structure.forEach(
      el => (el.plane.scale.y = this.steps * this.stepSize * 2)
    );
  }

  update(mouse, camera) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);

    if (this.intersects.length > 0) {
      obj = this.intersects[0].object;
      this.hoverState(true, obj);
    } else if (!this.isDragging) {
      this.hoverState(false);
    }
  }
}
