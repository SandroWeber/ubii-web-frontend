import * as THREE from 'three';
import { LayeredGraphScene } from './layered-graph-scene';

export class LayeredGraphVisTags extends LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    super(dataset, settings, renderer, camera, orbitControls);
    this.id = 'TAGS';
    this.geometry = new THREE.SphereGeometry(0.2, 64, 64);
    this.material = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.8
    });
    //The following methods are purposely not put in the super class constructor because in the future the bahavior of this visualization might need tweaking
    this.createDataPoints();
    this.createLinks();
    this.setupStructure(dataset);
    this.meshes.forEach(el => {
      this.checkNodePositionOnGrid(el);
    });
  }

  /*
   * Either returns 1) no tag   2) the single tag   3) a combination of all tags with " | " between them
   */
  getFormattedLayerName(node) {
    if (node.tags.length == 0) {
      return '';
    } else if (node.tags.length == 1) {
      return node.tags[0];
    } else {
      let tag = '';
      node.tags.sort().forEach(el => {
        tag = tag + ' | ' + el;
      });
      tag = tag.slice(3); //cuts of first " | "
      return tag;
    }
  }

  /*
   * This creates all the layers. In this case every Tag (combination of tags) gets its own layer
   */
  setupStructure(dataset) {
    this.structure = [];
    let tags = [],
      tag = '';

    //go through all nodes and their tags and add them structure of the graph
    //which means adding a new layer for each individual getFormattedLayerName()
    dataset.nodes.forEach(node => {
      if (node.tags.length > 1) {
        tag = this.getFormattedLayerName(node);
      } else {
        tag = node.tags[0];
      }
      if (!tags.includes(tag)) {
        //Every new tag is part of the individual structure of the graph
        this.addToStructure(tag);
        tags.push(tag);
      }

      this.meshes.find(el => el.userData.id == node.id).userData.layer = tag;
    });

    this.centerLayersIn3D(true, 'No Tags'); //this centers all layer on z-axis
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
    this.changeArrow(event.object);
    if (this.same && this.oldPos.equals(this.selected.position)) {
      //If the user only clicked on a node (oldPos the same) just deselect
      this.deselect();
      this.same = false;
    } else if (!this.oldPos.equals(this.selected.position)) {
      //If node actually got dragged somewhere else put it back on the grid
      this.deleteNodeFromGrid(event.object);
      this.checkNodePositionOnGrid(this.selected);
    }
    this.setSlimLayers(this.slimLayers); //maybe a layer has to resize if a node got dragged around
    this.isDragging = false;
  }

  /*
   * Method for handling the behavior during a dragging operation
   * This method is purposely not put in the super classes because in the future a visualization might be needing a different behavior while dragging
   */
  drag() {
    this.dragBehaviour();
    //If visualization-specific stuff has to happend during drag, put it here
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
      //Y-button for side view on layers
      this.camera.position.set(-8, 0, 0);
      this.orbitControls.update();
      this.showViewLabel('Y');
    }
  }
}
