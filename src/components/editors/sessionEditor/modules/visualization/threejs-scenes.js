import * as THREE from 'three';
import $ from 'jquery';

class SceneVisualization {
  constructor() {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1),);
    this.scene.add(light)
  }

  getScene() {
    return this.scene;
  }
}


export class Visualization1 extends SceneVisualization {
  constructor(dataset, domElement) {
    super();
    this.geometry =  new THREE.SphereGeometry(0.2, 64, 64);
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
      mesh.userData = {'id': node.id};
      this.meshes.push(mesh);
      mesh.position.set(THREE.Math.randFloat(-4, 4), THREE.Math.randFloat(-3, 3), 0);
      this.scene.add(mesh);
    });
  }

  setOutlinePass(outlinePass) {
    this.outlinePassReference = outlinePass;
  }

  createLinks() {
    this.dataset.links.forEach(function(link) {
      this.createLink(link);
    }, this);
  }

  createLink(link) {
    let arrow, dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == link.source).position;
    destination = this.meshes.find(el => el.userData.id == link.target).position;
    dir = new THREE.Vector3().subVectors(destination, origin);
    length = dir.length()-0.2;
    arrow = new THREE.ArrowHelper(dir.normalize(), origin, 1, 0xffffff);
    arrow.setLength(length, 0.4, 0.1);
    this.arrows.push({'source': link.source, 'target': link.target, 'arrow': arrow});
    this.scene.add(arrow);
  }

  updateLink(arrowLink, source, target) {
    let dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == source).position;
    destination = this.meshes.find(el => el.userData.id == target).position;
    dir = new THREE.Vector3().subVectors(destination, origin);
    length = dir.length()-0.2;
    arrowLink.position.copy(origin);
    arrowLink.setDirection(dir.normalize());
    arrowLink.setLength(length, 0.4, 0.1);

  }

  dragstart(event) {
    if(this.selected[0] == event.object) {
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.oldPos = (new THREE.Vector3()).copy(this.selected[0].position);
  }

  dragend(event) {
    this.changeArrow(event.object);
    if(this.level >= 0) {
      this.moveToLevel(this.level-4);
      this.level = -1;
    }
    if(this.same && this.oldPos.equals(this.selected[0].position)) {
      this.deselect();
      this.same = false;
    }
  }

  changeArrow(mesh) {
    let id = (this.meshes.find(el => el == mesh)).userData.id;
    this.arrows.forEach(el => {
      if(el.source == id) {
        this.updateLink(el.arrow, id, el.target);
      } else if(el.target == id) {
        this.updateLink(el.arrow, el.source, id);
      }
    });
  }

  moveToLevel(level) {
    if(this.selected.length > 0) {
      this.selected[0].position.set(this.selected[0].position.x, this.selected[0].position.y, level * 1);
      this.detectLevel(level);
      this.changeArrow(this.selected[0]);
    }
  }

  detectLevel(level) {
    let color = [0xCC0000, 0xD52E2E, 0xDC5454, 0xE27373, 0xffffff, 0x7373D2, 0x5454C9, 0x2E2EBE, 0x0000B0];
    level = level + 4;

    let checkRange = (nmbr) => {
      let abs = Math.round(nmbr);
      return Math.abs(abs - nmbr) <= 0.15 ? abs : nmbr;
    };

    if(Number.isNaN(level)) {
      let levels = [-4, -3, -2, -1, 1, 2, 3, 4];
      let range = checkRange(this.selected[0].position.z);
      if(levels.includes(range)) {
        range = range + 4;
        this.selected[0].material.color.set(color[range]);
        this.level = range;
      } else {
        this.selected[0].material.color.set(0xffffff);
        this.level = -1;
      }
    } else {
      this.selected[0].material.color.set(color[level]);
      this.level = -1;
    }
  }

  updateLabelSpritePosition(x, y) {
    this.nodeLabel.css({'top': y, 'left': x+30});
  }

  select(node) {
    this.selected.push(node);
    this.outlinePassReference.selectedObjects = this.selected;
  }

  deselect() {
    if(this.selected.length > 0) {
      this.selected = [];
      this.outlinePassReference.selectedObjects = [];
    }
  }

  switchSelect() {
    if(this.intersects.length == 0) {
        this.deselect();
    }
  }

  update(mouse, camera) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);

    if(this.intersects.length > 0) {
      obj = this.intersects[0].object;
      node = this.meshes.find(el => el == obj);
      this.nodeLabel.show();
      this.nodeLabel.html(node.name);
    } else {
      this.nodeLabel.hide();
    }
  }
}