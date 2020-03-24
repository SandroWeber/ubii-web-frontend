import * as THREE from 'three';
import $ from 'jquery';
import { GroupedGraphScene } from './threejs-gg-scene';

export class GroupedGraph extends GroupedGraphScene {
  constructor(dataset, snapToGrid) {
    super(dataset, snapToGrid);
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    this.createDataPoints();
    this.createLinks();
  }

  dragstart(event, camera) {
    if (this.selectedNode == event.object) {
      this.same = true;
    }
    this.select(event.object);
    this.setDragging(true);
  }

  dragend(event) {
    let oldPos = this.oldPos;
    this.setDragging(false);
    this.changeArrow(event.object);
    if (!event.object.userData.isGroup) {
      if (this.same && oldPos.equals(this.selectedNode.position)) {
        this.deselect(event.object);
        this.same = false;
      } else if (!this.selectKeyPressed) {
        let temp = this.selected.slice();
        temp.forEach(el => this.deselect(el));
        this.select(event.object);
      }
    } else {
      let find = this.structure.find(
        el => el.meshes.node.userData.id == event.object.userData.id
      );
      let temp = this.selected.slice();
      temp.forEach(el => this.deselect(el));
      let dir = new THREE.Vector3().subVectors(
        event.object.position,
        find.position
      );
      find.content.forEach(el => {
        el.position = new THREE.Vector3().addVectors(dir, el.position);
        this.changeArrow(el);
      });
      this.calcBoundingBox(event.object.userData.id);
      find.position = new THREE.Vector3().copy(event.object.position);
    }
    if (event.object.userData.group != '') {
      this.calcBoundingBox(event.object.userData.group);
      let find = this.structure.find(
        el => el.meshes.node.userData.id == event.object.userData.group
      );
      let position = this.calcCentroid(find.content);
      find.meshes.node.position.x = position.x;
      find.meshes.node.position.y = position.y;
      find.meshes.node.position.z = position.z;
    }
  }

  drag(event) {
    this.dragBehaviour();
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
    } else if (keyCode == 17) {
      this.selectKeyPressed = true;
    } else if (keyCode == 77) {
      if (this.selected.length > 0) {
        this.addToStructure();
      }
    } else if (keyCode == 82) {
      if (
        this.structure.length > 0 &&
        this.selectedNode != null &&
        this.selectedNode.userData.isGroup
      ) {
        this.deleteFromStructure(this.selectedNode.userData.id);
      }
    }
  }

  onKeyUp(event, controls) {
    let keyCode = event.which;
    if (keyCode == 17) {
      this.selectKeyPressed = false;
    }
  }
}
