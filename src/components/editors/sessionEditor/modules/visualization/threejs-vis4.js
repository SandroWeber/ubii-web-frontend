import * as THREE from 'three';
import $ from 'jquery';
import { LayeredGraphScene } from './threejs-lg-scene';
import { translatedToMatrix, randomHexColor } from '../utils';

export class Visualization4 extends LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'STEPS';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor because in the future the bahavior of this visualization might need tweaking
    this.startNode = settings.startNode;
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

  /*
   * This creates all the layers. In this case when starting from one node and stepping down every path,
   * every number of steps gets a layer.
   */
  setupStructure(dataset) {
    this.structure = [];
    let matrix = translatedToMatrix(dataset);
    let levels = [];
    this.recursiveGraphCheck(
      matrix,
      levels,
      dataset,
      0,
      dataset.nodes.findIndex(el => el.id == this.startNode)
    );
    let created = false;
    let depth = 0;
    let temp;
    this.structure.forEach(el => {
      if (el.depth > depth) {
        depth = el.depth;
      }
    });
    depth /= this.layerStepSize;
    depth++;
    this.meshes.forEach(el => {
      if (el.userData.level == undefined) {
        if (!created) {
          this.addToStructure('Unreachable');
          created = true;
        }
        this.setLevelDepth('Unreachable', this.layerStepSize * depth);
        temp = this.structure.find(el2 => el2.id == 'Unreachable');
        temp.content.push(el);
        el.material.color.set(temp.color);
        this.moveTo(el, this.layerStepSize * depth);
        el.userData.level = 'Unreachable';
      }
    });
    let del = [];
    this.structure.forEach(el => {
      temp = [];
      el.content.forEach(el2 => {
        if (el2.userData.level != el.id) {
          temp.push(el2);
        }
      });
      temp.forEach(el2 => {
        el.content.splice(
          el.content.findIndex(el3 => el3.userData.level == el2.userData.level),
          1
        );
      });
      if (el.content.length == 0) {
        del.push(el.id);
      }
    });
    del.forEach(el => {
      let find = this.structure.find(el2 => el2.id == el);
      this.scene.remove(find.plane.p);
      find.plane.b.forEach(el2 => {
        this.scene.remove(el2);
      });
      find.plane.g.forEach(el2 => {
        this.scene.remove(el2);
      });
      temp = this.structure.findIndex(el2 => el2.id == el);
      this.structure.splice(temp, 1);
    });

    //All the stuff from here on in this method is just to position all the layers
    //relative to the center (z-coord=0)
    let tempStr = {};
    let temp1 = 1,
      temp2 = 0;

    let addToTemp = (id, counter) => {
      if (!(id in tempStr)) {
        tempStr[id] = counter;
      }
    };

    //Find out how many layers there are (n) and count them from 0 to n
    //The order here reflects the layers' order on the z-axis
    this.structure.forEach(el => {
      if (el.id in tempStr) {
        return;
      }
      if (el.id == 'Unreachable') {
        temp2 = 0;
      } else {
        temp2 = temp1;
        temp1++;
      }
      addToTemp(el.id, temp2);
    });

    if (!('Unreachable' in tempStr)) {
      Object.keys(tempStr).forEach(el => {
        tempStr[el]--;
      });
    }

    //Now calc temp1 which decides how far back each layer gets shifted
    temp2 = Object.keys(tempStr).length;
    if (temp2 % 2 == 0) {
      //with an even number of layers they have to be shifted unevenly (no layer can be at z-coord=0)
      temp1 = this.layerStepSize / 2 + (temp2 / 2 - 1) * this.layerStepSize;
    } else {
      //with an uneven number of layers they have to be shifted evenly (one layer can be at z-coord=0)
      temp1 = Math.floor(temp2 / 2) * this.layerStepSize;
    }

    temp1 *= -1;

    //actually put every layer on it's real depth (z-coord)
    this.structure.forEach(el => {
      temp2 = tempStr[el.id] * this.layerStepSize + temp1; //Shift each layer back by it's index and
      //the space in between each layer

      this.meshes.forEach(el2 => {
        if (el2.userData.level == el.id) {
          this.setLevelDepth(el.id, temp2);
          this.moveTo(el2, temp2);
          el2.material.color.set(el.color);
        }
      });
    });
  }

  recursiveGraphCheck(matrix, levels, dataset, counter, index) {
    let level = counter + ' step' + (counter == 1 ? '' : 's');
    if (level == '0 steps') {
      level += ' (start)';
    }
    if (!levels.includes(level)) {
      levels.push(level);
      this.addToStructure(level);
    }
    this.meshes[index].userData.level = level;
    let l = this.structure.find(el => el.id == level);
    let found = l.content.find(
      el => el.userData.id == this.meshes[index].userData.id
    );
    if (found == undefined) {
      l.content.push(this.meshes[index]);
    }
    let temp = counter + 1;
    this.meshes[index].material.color.set(l.color);
    matrix[index].forEach((el, index2) => {
      if (el) {
        this.recursiveGraphCheck(matrix, levels, dataset, temp, index2);
      }
    });
  }

  /*
   * Method for handling the start of a dragging operation.
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior on dragstart
   */
  dragstart(event) {
    this.orbitControls.enabled = false;
    if (this.selected == event.object) {
      //If the dragged node is the same one that is already selected
      this.same = true;
    }
    this.deselect();
    this.select(event.object);
    this.setDragging(true);
  }

  /*
   * Method for handling the end of a dragging operation.
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior on dragend
   */
  dragend(event) {
    this.orbitControls.enabled = true;
    this.changeArrow(this.selected);
    if (this.same && this.oldPos.equals(this.selected.position)) {
      //If the user only clicked on a node (oldPos the same) just deselect
      this.deselect();
      this.same = false;
    } else if (!this.oldPos.equals(this.selected.position)) {
      //If node actually got dragged somewhere else put it back on the grid
      this.deleteNodeFromGrid(this.selected);
      this.checkNodePositionOnGrid(this.selected);
    }
    this.setSlimLayers(this.slimLayers); //maybe a layer has to resize if a node got dragged around
    this.isDragging = false;
  }

  /*
   * Method for handling the behavior during a dragging operation
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior while dragging
   */
  drag(event) {
    this.dragBehaviour();
    //If visualization-specific stuff has to happend during drag, put it here
  }

  /*
   * Method for handling keypresses
   */
  onKeyDown(event, showViewLabel) {
    let keyCode = event.which;
    if (keyCode == 88) {
      //X-button for front view
      this.orbitControls.reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      //Y-button for side view on layers
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      showViewLabel('Y');
    }
  }
}
