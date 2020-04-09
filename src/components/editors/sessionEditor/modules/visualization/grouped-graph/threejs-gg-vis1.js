import * as THREE from 'three';
import $ from 'jquery';
import { GroupedGraphScene } from './threejs-gg-scene';

export class GGVisualization1 extends GroupedGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'MANUAL';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor
    //because in the future the bahavior of this visualization might need tweaking
    this.createDataPoints();
    this.createLinks();
  }

  /*
   * Method for handling the start of a dragging operation.
   * This method is purposely not put in the super classes because in the future a visualization might be
   * needing a different behavior on dragstart
   */
  dragstart(event) {
    this.orbitControls.enabled = false;
    if (this.selectedNode == event.object) {
      this.same = true;
    }
    this.select(event.object);
    this.setDragging(true);
  }

  /*
   * Method for handling the end of a dragging operation.
   * This method is purposely not put in the super classes because in the future a visualization might be
   * needing a different behavior on dragend
   */
  dragend(event) {
    this.orbitControls.enabled = true;
    let oldPos = this.oldPos;
    this.setDragging(false);
    this.changeArrow(event.object);

    if (!event.object.userData.isGroup) {
      //if the dragged object was a normal nodes
      //and not a group node

      if (this.same && oldPos.equals(this.selectedNode.position)) {
        //If the user only clicked on a node (oldPos the same) just deselect
        this.deselect(event.object);
        this.same = false;
      } else if (!this.selectKeyPressed) {
        //If the select key (strg) was not pressed
        //deselect all other nodes and only select the
        //one that got dragged

        let temp = this.selected.slice(); //temp is needed because I cannot cut
        //out of an array while traversing it simoultaneously
        temp.forEach(el => this.deselect(el));
        this.select(event.object);
      }
    } else {
      //if the dragged object was group node
      //all the "hidden" node's positions inside have to be updated

      let find = this.structure.find(
        el => el.meshes.node.userData.id == event.object.userData.id
      );

      let temp = this.selected.slice(); //temp is needed because I cannot cut
      //out of an array while traversing it simoultaneously
      temp.forEach(el => this.deselect(el));

      //get where the group node / centroid has move to
      //so that "hidden" nodes inside can be moved
      //accordingly
      let dir = new THREE.Vector3().subVectors(
        event.object.position,
        find.position
      );

      //update the positions of all "hidden" nodes inside the group
      find.content.forEach(el => {
        el.position = new THREE.Vector3().addVectors(dir, el.position);
        this.changeArrow(el);
      });

      this.calcBoundingBox(event.object.userData.id); //reevaluate the group's bounding box

      find.position = new THREE.Vector3().copy(event.object.position);
    }

    //If a node inside an (obviously opened) group has been dragged arounf
    //update the group's bounding box
    if (event.object.userData.group != '') {
      this.calcBoundingBox(event.object.userData.group); //reevaluate the group's bounding box
      let find = this.structure.find(
        el => el.meshes.node.userData.id == event.object.userData.group
      );

      //also update the now "hidden" (because group is open and individual nodes are visible)
      //group node's (centroid) position
      let position = this.calcCentroid(find.content);
      find.meshes.node.position.x = position.x;
      find.meshes.node.position.y = position.y;
      find.meshes.node.position.z = position.z;
    }
  }

  /*
   * Method for handling the behavior during a dragging operation
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior while dragging
   */
  drag(event) {
    this.dragBehaviour();
  }

  /*
   * Method for handling keypresses
   */
  onKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 88) {
      //X-button for front view
      this.orbitControls.reset();
      this.showViewLabel('X');
    } else if (keyCode == 89) {
      //Y-button for side view
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      this.showViewLabel('Y');
    } else if (keyCode == 17) {
      this.selectKeyPressed = true;
    } else if (keyCode == 77) {
      //M-Button for merging nodes into one group
      if (this.selected.length > 1) {
        this.addToStructure();
      }
    } else if (keyCode == 82) {
      //R-Button from removing a group entirely
      //and resurface the individual nodes
      if (
        this.structure.length > 0 &&
        this.selectedNode != null &&
        this.selectedNode.userData.isGroup
      ) {
        //only remove if there actually is a group selected
        //and not just a normal node
        this.deleteFromStructure(this.selectedNode.userData.id);
      }
    }
  }

  /*
   * Method for handling keyup events
   */
  onKeyUp(event) {
    let keyCode = event.which;
    if (keyCode == 17) {
      this.selectKeyPressed = false;
    }
  }
}
