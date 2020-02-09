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
    this.selected = null;
    this.oldPos;
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
    this.intersects = null;
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

  dragstart(event) {
    this.select(true);
    this.oldPos = (new THREE.Vector3()).copy(this.selected.position);
  }

  dragend(event) {
    // this.select(this.oldPos.equals(this.selected.position));
    this.select(true);
    this.changeArrow(event.object);

  }

  changeArrow(mesh) {
    let id = (this.meshes.find(el => el == mesh)).userData.id;
    this.arrows.forEach(el => {
      if(el.source == id) {
        this.scene.remove(el.arrow);
        this.createLink({'source': id, 'target': el.target})
      } else if(el.target == id) {
        this.scene.remove(el.arrow);
        this.createLink({'source': el.source, 'target': id})
      }
    });
  }

  moveToLevel(level) {
    if(this.selected != null) {
      this.selected.position.set(this.selected.position.x, this.selected.position.y, level * 1);
      this.changeArrow(this.selected);
    }
  }

  updateLabelSpritePosition(x, y) {
    this.nodeLabel.css({'top': y, 'left': x+30});
  }

  select(isDrag) {
    if(this.intersects.length > 0) {
      if(this.intersects[0].object != this.selected) {
        if(this.selected != null) {
          this.selected.material.color.set(0xffffff);
        }
        this.selected = this.intersects[0].object;
        this.intersects[0].object.material.color.set(0xff0000);
      } else if(!isDrag) {
        this.selected.material.color.set(0xffffff);
        this.selected = null;
      }
    } else if(this.selected != null) {
        this.selected.material.color.set(0xffffff);
        this.selected = null;
    }
  }

  update(mouse, camera) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);

    if(this.intersects.length > 0) {
      obj = this.intersects[0].object;
      node = this.meshes.find(el => el == obj);
      this.nodeLabel.html(node.name);
    } else {
      this.nodeLabel.html("");
    }
  }
}