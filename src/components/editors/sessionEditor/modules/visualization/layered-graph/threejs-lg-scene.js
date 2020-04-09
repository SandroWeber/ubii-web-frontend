import * as THREE from 'three';
import $ from 'jquery';
import { randomHexColor } from '../../utils';
import DragControls from 'three-dragcontrols';
import { RenderPass, EffectComposer, OutlinePass } from 'three-outlinepass';

export class LayeredGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);
    this.type = 'LAYERED';
    this.dataset = dataset;
    this.structure = []; //The "interal structure" of a graph, can be whatever the current visualization / graphType chooses to focus on (e.g. layers, groups etc.)
    this.locked = { x: false, y: false, z: true };
    this.guideline = null;
    this.oldPos; //needed to check if selected node was actually dragged or only just clicked on to deselect it
    this.meshes = [];
    this.arrows = [];
    this.materials = [];
    this.selected = null; //the currently selected node (settings.viewNode)
    this.layers = [];
    this.intersects = null;
    this.planeIntersects = null;
    this.same = false;
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
    this.stepSize = 1; //step size for the grid
    let i = 4;
    while (i * i < dataset.nodes.length) {
      i++;
    }
    this.steps = i; //how many steps does the grid need depending on the amount of nodes (so every node gets at least one spot on the grid)
    this.layerStepSize = 3; //spacing in between the layers on z-axis
    this.hover = null;
    this.zero = {};
    this.createZeroMarker();
    this.showAllLayers = false;
    this.slimLayers = false;
    this.focusedLayer = '';
    this.gridPositions = [];
    this.snapToGrid = settings.snapToGrid;
    this.change = null;
    this.camera = camera;

    this.orbitControls = orbitControls;

    this.dragControls = new DragControls(
      this.meshes,
      camera,
      document.getElementById('threejs-container')
    );
    this.dragControls.addEventListener(
      'dragstart',
      this.dragstart.bind(this),
      false
    );
    this.dragControls.addEventListener(
      'dragend',
      this.dragend.bind(this),
      false
    );
    this.dragControls.addEventListener('drag', this.drag.bind(this), false);

    this.composer = new EffectComposer(renderer);
    let renderPass = new RenderPass(this.scene, this.camera);
    let outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    outlinePass.renderToScreen = true;
    outlinePass.selectedObjects = [];

    this.composer.addPass(renderPass);
    this.composer.addPass(outlinePass);

    outlinePass.edgeStrength = 8;
    outlinePass.edgeGlow = 0;
    outlinePass.visibleEdgeColor.set(0xffe62b);
    outlinePass.hiddenEdgeColor.set(0xffe62b);

    this.setOutlinePass(outlinePass);
  }

  /*
   * binds reference for view label function in visualization-manager
   */
  setShowViewLabel(fct) {
    this.showViewLabel = fct;
  }

  setShowAll(showAll) {
    this.showAllLayers = showAll;
    this.structure.forEach(el => {
      el.plane.p.visible = showAll; //make the plane itself visible/invisible
      el.plane.b.forEach(el => {
        //also make the 4 border lines visible/invisible
        el.visible = showAll;
      });
    });
  }

  /*
   * change layers to slim size
   */
  setSlimLayers(slimLayers) {
    this.slimLayers = slimLayers;
    this.structure.forEach(el => {
      this.calculateLayerDimensions(el.id); //first get dimension of every layer depending on where the nodes of that layer are positioned
      this.setLayerDimensions(el.id); //set the dimension of every layer that have been calculated a step before
    });
  }

  setSnapToGrid(snapToGrid) {
    this.snapToGrid = snapToGrid;
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

  onKeyUp(event) {}

  setOutlinePass(outlinePass) {
    this.outlinePassReference = outlinePass;
  }

  setDragging(dragging) {
    this.isDragging = dragging;
    //The old position is needed to check if a node actually got dragged or only clicked on for deselecting
    this.oldPos = new THREE.Vector3().copy(this.selected.position);
  }

  /*
   * binds reference for change setting function in GraphView
   */
  setChange(change) {
    this.change = change;
  }

  /*
   * move node to layer physically (z-axis)
   */
  moveTo(node, layer) {
    node.position.set(node.position.x, node.position.y, layer);
    this.changeArrow(node);
  }

  /*
   * what happens to a node during dragging motion
   */
  dragBehaviour() {
    this.point = null;
    this.point = this.planeIntersects.find(
      el => el.object.userData.id == this.selected.userData.layer
    );
    if (this.point != null) {
      //if mouse ray intersects with layer of selected node put node on intersection point
      this.selected.position.x = this.point.point.x;
      this.selected.position.y = this.point.point.y;
      this.selected.position.z = this.point.point.z;
    } else {
      //if mouse ray doesn' intersect with layer of selected node put node on old position from before dragging
      this.selected.position.x = this.oldPos.x;
      this.selected.position.y = this.oldPos.y;
      this.selected.position.z = this.oldPos.z;
    }
    let distance = this.steps * this.stepSize;
    //max x distance / border while dragging
    if (this.selected.position.x > distance) {
      this.selected.position.x = distance;
    } else if (this.selected.position.x < -distance) {
      this.selected.position.x = -distance;
    }
    //max y distance / border while dragging
    if (this.selected.position.y > distance) {
      this.selected.position.y = distance;
    } else if (this.selected.position.y < -distance) {
      this.selected.position.y = -distance;
    }
  }

  /*
   * What happens during hover over node
   */
  hoverState(start, obj) {
    if (start) {
      //start=true to show label and layer
      this.hover = obj;
      this.nodeLabel.show(); //this is the label that shows the nodes name and follows the mouse
      this.nodeLabel.html('Name: ' + obj.name);
      if (this.hover.userData.layer != '') {
        //if node is on layer (normally the case) highlight layer (and grid of layer)
        this.showLayer(obj.userData.layer, true);
      }
    } else if (this.hover != null) {
      //start=false and hover object (set from first firing of this function) is existent
      let layer = this.hover.userData.layer;
      this.hover = null;
      this.nodeLabel.hide();
      this.showLayer(layer, false);
    }
  }

  /*
   * shows (highlights) the layer and grid of the layer of the node which the mouse hovers over
   */
  showLayer(layer, show) {
    let structure = this.structure.find(el => el.id == layer); //find the part of the structure that has all parts of the layer of the hovered node
    if (this.showAllLayers) {
      //if layers are not hidden just increase opactiy to highlight layer of hovered node
      structure.plane.p.material.opacity = show ? 0.6 : 0.4;
    } else {
      //if layers are hidden (settings.showAll) just show the one of the hovered node
      structure.plane.p.visible = show;
      structure.plane.b.forEach(el => {
        el.visible = show;
      });
    }
    if (!show) {
      //the param show=false just hides all layers
      structure.plane.g.forEach(el => (el.visible = false));
    } else {
      //the param show=false shows the layer of hovered node
      //remove old grid
      structure.plane.g.forEach(el => {
        this.scene.remove(el);
        el.visible = false;
      });
      if (!this.slimLayers) {
        //if layers are currently not show in small size (slim)
        //create all lines for the grid of that layer
        structure.plane.g = this.createGrid(
          this.stepSize * this.steps,
          structure.color
        );

        //put grid on the right z-depth depending on where the layers sits on z-axis
        structure.plane.g.forEach(el => {
          el.visible = true;
          el.geometry.vertices[0].z = structure.depth;
          el.geometry.vertices[1].z = structure.depth;
        });
      } else {
        //if layers are currently shown in small size it could happen that no the whole grid (so all lines in all directions) have to be shown
        let lineMat = new THREE.LineBasicMaterial({
          color: structure.color
        });

        //
        let grid = this.gridHelperMethod(
          {
            x: [structure.plane.x[0], structure.plane.x[1]],
            y: [structure.plane.y[0], structure.plane.y[1]]
          },
          lineMat
        );

        structure.plane.g = grid;

        //put grid on the right z-depth depending on where the layers sits on z-axis
        structure.plane.g.forEach(el => {
          el.geometry.vertices[0].z = structure.depth;
          el.geometry.vertices[1].z = structure.depth;
          el.visible = false;
          this.scene.add(el); //because grid is generated newly add all lines to the scene
        });

        let x, y;

        //here the grid gets made "smaller" by omitting/hiding all lines that extend far beyond the actual borders of the slim layer size
        structure.plane.g.forEach(el => {
          if (el.userData.vertical) {
            x = el.geometry.vertices[0].x;
            if (x > structure.plane.x[1] && x < structure.plane.x[0]) {
              //check if x-pos of grid-line is beyond x-size of slim layer
              el.visible = true;
            }
          } else {
            y = el.geometry.vertices[0].y;
            if (y > structure.plane.y[1] && y < structure.plane.y[0]) {
              //check if y-pos of grid-line is beyond y-size of slim layer
              el.visible = true;
            }
          }
        });
      }
    }
  }

  /*
   * this adds a new layer to the structure of a visualization
   */
  addToStructure(id, color) {
    let c;
    if (color == undefined) {
      c = randomHexColor(); //right now only random colors are choosen
    } else {
      c = color; //possibility for manually (automatically via algorithm) color selection
    }

    let plane = this.createLayerPlane(c);

    let distance = this.steps * this.stepSize; //how far the layer extends in x and y direction

    let geometry = new THREE.Geometry();

    //corner points of the 2d layer geometry (plane) for fullPlane
    geometry.vertices.push(
      new THREE.Vector3(distance, distance, 0),
      new THREE.Vector3(distance, -distance, 0),
      new THREE.Vector3(-distance, -distance, 0),
      new THREE.Vector3(-distance, distance, 0)
    );

    geometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3));

    //the fullPlane is inivisble and is used for mouse ray cast while dragging when the layers are set to slim
    //this is needed so that a node can be dragged "out of" the slim layer and is not restricted by it
    let fullPlane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
      })
    );

    fullPlane.material.visible = false;
    fullPlane.userData.id = id;
    this.scene.add(fullPlane);

    this.structure.push({
      id: id,
      color: c,
      content: [],
      plane: plane,
      fullPlane: fullPlane
    });

    plane.p.userData.id = id;

    //next to lines needed in case settings.slimLayers is already set to true right after initialization of layer
    this.calculateLayerDimensions(id);
    this.setLayerDimensions(id);
  }

  /*
   * This methods is called after the structure (all layers) has been created
   * to center the layers on the z-axis so that the center of rotation of the camera
   * is directly in the middle
   */
  centerLayersIn3D(pushNodes, specialState) {
    let tempStr = {}; //temporary structure to count up
    let temp1 = specialState == undefined ? 0 : 1; //reserve first layer for special state (like "Unreachable" or "No Tags")
    let temp2 = 0;

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
      if (specialState != undefined && el.id == specialState) {
        temp2 = 0;
      } else {
        temp2 = temp1;
        temp1++;
      }
      addToTemp(el.id, temp2);
    });

    if (specialState != undefined && !(specialState in tempStr)) {
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

    let self = this;
    //actually put every layer on it's real depth (z-coord)
    this.structure.forEach(el => {
      temp2 = tempStr[el.id] * this.layerStepSize + temp1; //Shift each layer back by it's index and
      //the space in between each layer

      self.meshes.forEach(el2 => {
        if (el2.userData.layer == el.id) {
          if (pushNodes) {
            el.content.push(el2);
          }
          self.setLayerDepth(el.id, temp2);
          self.moveTo(el2, temp2);
          el2.material.color.set(el.color);
        }
      });
    });

    if (specialState != undefined && specialState in tempStr) {
      temp1 = this.structure.findIndex(el => el.id == specialState);
      temp2 = this.structure.find(el => el.id == specialState);
      this.structure.splice(temp1, 1);
      this.structure.unshift(temp2);
    }
  }

  /*
   * Intermediate function to create all the meshes for a layer
   */
  createLayerPlane(color) {
    let distance = this.steps * this.stepSize;
    let geometry = new THREE.Geometry();

    //corner points of the 2d layer geometry (plane)
    geometry.vertices.push(
      new THREE.Vector3(distance, distance, 0),
      new THREE.Vector3(distance, -distance, 0),
      new THREE.Vector3(-distance, -distance, 0),
      new THREE.Vector3(-distance, distance, 0)
    );

    geometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3));

    let plane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      })
    );

    plane.renderOrder = 1; //this is needed because otherwise layers sometimes occlude nodes

    if (!this.showAllLayers) {
      //don't show a layer initially if not meant to (so only on hover over node)
      plane.visible = false;
    }

    this.scene.add(plane);

    //x and y are the dimensions of the plane
    //p is the actual visible layer plane
    //b contains the 4 border lines
    //g contains all the grid lines
    return {
      x: [distance, -distance],
      y: [distance, -distance],
      p: plane,
      b: this.createLayerPlaneBorder(distance, color),
      g: this.createGrid(distance, color)
    };
  }

  /*
   * This creates the 4 lines on the border of a layer. This is important because from the side-view/y-view
   * layers would otherwise not be visible because they are only 2D geometries with no depth. So they get
   * an actual line-edge/border
   */
  createLayerPlaneBorder(distance, color) {
    let border = [];
    let lineMat = new THREE.LineBasicMaterial({
      color: color
    });
    let geometry = new THREE.Geometry();
    //top line (1st point: top left; 2nd point: top right)
    geometry.vertices.push(
      new THREE.Vector3(-distance, distance, 0),
      new THREE.Vector3(distance, distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));

    geometry = new THREE.Geometry();
    //right line (1st point: top right; 2nd point: bottom right)
    geometry.vertices.push(
      new THREE.Vector3(distance, distance, 0),
      new THREE.Vector3(distance, -distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));

    geometry = new THREE.Geometry();
    //bottom line (1st point: bottom right; 2nd point: bottom left)
    geometry.vertices.push(
      new THREE.Vector3(distance, -distance, 0),
      new THREE.Vector3(-distance, -distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));

    geometry = new THREE.Geometry();
    //left line (1st point: bottom left; 2nd point: top left)
    geometry.vertices.push(
      new THREE.Vector3(-distance, -distance, 0),
      new THREE.Vector3(-distance, distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));
    border.forEach(el => this.scene.add(el));
    return border;
  }

  /*
   * This is an intermediate function for creating the grid lines for a layer
   * distance means how far in any direction the grid of the layer should extend
   * normaly the number of steps a grid has times (this.steps) the distance between two grid lines (this.stepSize)
   */
  createGrid(distance, color) {
    let lineMat = new THREE.LineBasicMaterial({
      color: color
    });

    let grid = this.gridHelperMethod(
      { x: [distance, -distance], y: [distance, -distance] },
      lineMat
    );

    grid.forEach(el => {
      el.visible = false;
      this.scene.add(el);
    });
    return grid;
  }

  /*
   * this creates the actual grid
   */
  gridHelperMethod(dimensions, lineMat) {
    let distance = this.steps * this.stepSize;
    let grid = [],
      line;

    //First all vertical lines get created (1st point of line always upper one, 2nd point of line always lower one)

    let geometry = new THREE.Geometry();
    //1st the center vertical line (x-coord = 0)
    geometry.vertices.push(
      new THREE.Vector3(0, dimensions.y[0], 0),
      new THREE.Vector3(0, dimensions.y[1], 0)
    );
    line = new THREE.Line(geometry, lineMat);
    line.userData.vertical = true;
    grid.push(line);

    //all lines to the "right" of center line (positive x-coordinate)
    for (let i = this.stepSize; i < this.steps; i += this.stepSize) {
      geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(i, dimensions.y[0], 0),
        new THREE.Vector3(i, dimensions.y[1], 0)
      );
      line = new THREE.Line(geometry, lineMat);
      line.userData.vertical = true;
      grid.push(line);
    }

    //all lines to the "left" of center line (negative x-coordinate)
    for (let i = distance - this.stepSize; i > 0; i -= this.stepSize) {
      geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(-i, dimensions.y[0], 0),
        new THREE.Vector3(-i, dimensions.y[1], 0)
      );
      line = new THREE.Line(geometry, lineMat);
      line.userData.vertical = true;
      grid.push(line);
    }

    //Now all horizontal lines get created

    geometry = new THREE.Geometry();
    //1st the center horizontal line (y-coor = 0)
    geometry.vertices.push(
      new THREE.Vector3(dimensions.x[0], 0, 0),
      new THREE.Vector3(dimensions.x[1], 0, 0)
    );
    line = new THREE.Line(geometry, lineMat);
    line.userData.vertical = false;
    grid.push(line);

    //all lines to the "top" of center line (positive y-coordinate)
    for (let i = this.stepSize; i < this.steps; i += this.stepSize) {
      geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(dimensions.x[0], i, 0),
        new THREE.Vector3(dimensions.x[1], i, 0)
      );
      line = new THREE.Line(geometry, lineMat);
      line.userData.vertical = false;
      grid.push(line);
    }

    //all lines to the "bottom" of center line (negative y-coordinate)
    for (let i = distance - this.stepSize; i > 0; i -= this.stepSize) {
      geometry = new THREE.Geometry();
      geometry.vertices.push(
        new THREE.Vector3(dimensions.x[0], -i, 0),
        new THREE.Vector3(dimensions.x[1], -i, 0)
      );
      line = new THREE.Line(geometry, lineMat);
      line.userData.vertical = false;
      grid.push(line);
    }
    return grid;
  }

  /*
   * Sets the z-axis depth of a layer
   */
  setLayerDepth(id, depth) {
    let find = this.structure.find(str => str.id == id);
    find.depth = depth;
    find.plane.p.position.z = depth; //z-depth of actual layer plane
    find.fullPlane.position.z = depth; //z-depth of invisible fullPlane
    //z-depth of a layer's border lines
    find.plane.b.forEach(el => {
      el.geometry.verticesNeedUpdate = true;
      el.geometry.vertices[0].z = depth;
      el.geometry.vertices[1].z = depth;
    });
  }

  /*
   * This sets structure.plane.x and structure.plane.y
   * These are the dimensions for a layer which are either full (distance ? this.steps * this.stepSize)
   * or slim (only using as much place as the nodes on that layer need (minimum 1 * this.stepSize for empty layer))
   */
  calculateLayerDimensions(layer) {
    let x = [0, 0];
    let y = [0, 0];
    let structure = this.structure.find(el => el.id == layer);
    structure.content.forEach(el => {
      if (el.position.x > 0) {
        //Get positive x-coordinate of the node "farthest to the right"
        if (el.position.x > x[0]) {
          x[0] = el.position.x;
        }
      } else {
        //Get negative x-coordinate of the node "farthest to the left"
        if (el.position.x < x[1]) {
          x[1] = el.position.x;
        }
      }
      if (el.position.y > 0) {
        //Get positive y-coordinate of the node "farthest to the top"
        if (el.position.y > y[0]) {
          y[0] = el.position.y;
        }
      } else {
        //Get negative y-coordinate of the node "farthest to the bottom"
        if (el.position.y < y[1]) {
          y[1] = el.position.y;
        }
      }
    });

    //Minimum size of an empty layer
    //If layer contains only one node no minimum is set so the layer strechtes from zero point to the one node
    if (x[0] == 0 && x[1] == 0 && y[0] == 0 && y[1] == 0) {
      x[0] = this.stepSize * 1;
      x[1] = -this.stepSize * 1;
      y[0] = this.stepSize * 1;
      y[1] = -this.stepSize * 1;
    }

    structure.plane.x = x;
    structure.plane.y = y;
  }

  /*
   * Applies dimensions to a layer, either full size of slim size calculated by calculateLayerDimensions()
   */
  setLayerDimensions(layer) {
    let distance = this.steps * this.stepSize;
    let s = this.structure.find(el => el.id == layer);
    let g = s.plane.p.geometry;
    let bs = s.plane.b;
    g.verticesNeedUpdate = true;
    bs.forEach(el => (el.geometry.verticesNeedUpdate = true));
    if (!this.slimLayers) {
      //If full layer should be shown just take maximum distance of a layer
      let distance = this.steps * this.stepSize;
      g.vertices[0].x = distance; //Plane top right vertex position x-coordinate
      g.vertices[0].y = distance; //Plane top right vertex position y-coordinate
      g.vertices[1].x = distance; //Plane bottom right vertex position x-coordinate
      g.vertices[1].y = -distance; //Plane bottom right vertex position y-coordinate
      g.vertices[2].x = -distance; //Plane bottom left vertex position x-coordinate
      g.vertices[2].y = -distance; //Plane bottom left vertex position y-coordinate
      g.vertices[3].x = -distance; //Plane top left vertex position x-coordinate
      g.vertices[3].y = distance; //Plane top left vertex position y-coordinate
      bs[0].geometry.vertices[0].x = -distance; //Border top line top left vertex position x-coordinate
      bs[0].geometry.vertices[0].y = distance; //Border top line top left vertex position y-coordinate
      bs[0].geometry.vertices[1].x = distance; //Border top line top right vertex position x-coordinate
      bs[0].geometry.vertices[1].y = distance; //Border top line top right vertex position y-coordinate
      bs[1].geometry.vertices[0].x = distance; //Border right line top right vertex position x-coordinate
      bs[1].geometry.vertices[0].y = distance; //Border right line top right vertex position y-coordinate
      bs[1].geometry.vertices[1].x = distance; //Border right line bottom right vertex position x-coordinate
      bs[1].geometry.vertices[1].y = -distance; //Border right line bottom right vertex position y-coordinate
      bs[2].geometry.vertices[0].x = distance; //Border bottom line bottom right vertex position x-coordinate
      bs[2].geometry.vertices[0].y = -distance; //Border bottom line bottom right vertex position y-coordinate
      bs[2].geometry.vertices[1].x = -distance; //Border bottom line bottom left vertex position x-coordinate
      bs[2].geometry.vertices[1].y = -distance; //Border bottom line bottom left vertex position y-coordinate
      bs[3].geometry.vertices[0].x = -distance; //Border left line bottom left vertex position x-coordinate
      bs[3].geometry.vertices[0].y = -distance; //Border left line bottom left vertex position y-coordinate
      bs[3].geometry.vertices[1].x = -distance; //Border left line top left vertex position x-coordinate
      bs[3].geometry.vertices[1].y = distance; //Border left line top left vertex position y-coordinate
    } else {
      g.vertices[0].x = s.plane.x[0]; //Plane top right vertex position x-coordinate
      g.vertices[0].y = s.plane.y[0]; //Plane top right vertex position y-coordinate
      g.vertices[1].x = s.plane.x[0]; //Plane bottom right vertex position x-coordinate
      g.vertices[1].y = s.plane.y[1]; //Plane bottom right vertex position y-coordinate
      g.vertices[2].x = s.plane.x[1]; //Plane bottom left vertex position x-coordinate
      g.vertices[2].y = s.plane.y[1]; //Plane bottom left vertex position y-coordinate
      g.vertices[3].x = s.plane.x[1]; //Plane top left vertex position x-coordinate
      g.vertices[3].y = s.plane.y[0]; //Plane top left vertex position y-coordinate
      bs[0].geometry.vertices[0].x = s.plane.x[1]; //Border top line top left vertex position x-coordinate
      bs[0].geometry.vertices[0].y = s.plane.y[0]; //Border top line top left vertex position y-coordinate
      bs[0].geometry.vertices[1].x = s.plane.x[0]; //Border top line top right vertex position x-coordinate
      bs[0].geometry.vertices[1].y = s.plane.y[0]; //Border top line top right vertex position y-coordinate
      bs[1].geometry.vertices[0].x = s.plane.x[0]; //Border right line top right vertex position x-coordinate
      bs[1].geometry.vertices[0].y = s.plane.y[0]; //Border right line top right vertex position y-coordinate
      bs[1].geometry.vertices[1].x = s.plane.x[0]; //Border right line bottom right vertex position x-coordinate
      bs[1].geometry.vertices[1].y = s.plane.y[1]; //Border right line bottom right vertex position y-coordinate
      bs[2].geometry.vertices[0].x = s.plane.x[0]; //Border bottom line bottom right vertex position x-coordinate
      bs[2].geometry.vertices[0].y = s.plane.y[1]; //Border bottom line bottom right vertex position y-coordinate
      bs[2].geometry.vertices[1].x = s.plane.x[1]; //Border bottom line bottom left vertex position x-coordinate
      bs[2].geometry.vertices[1].y = s.plane.y[1]; //Border bottom line bottom left vertex position y-coordinate
      bs[3].geometry.vertices[0].x = s.plane.x[1]; //Border left line bottom left vertex position x-coordinate
      bs[3].geometry.vertices[0].y = s.plane.y[1]; //Border left line bottom left vertex position y-coordinate
      bs[3].geometry.vertices[1].x = s.plane.x[1]; //Border left line top left vertex position x-coordinate
      bs[3].geometry.vertices[1].y = s.plane.y[0]; //Border left line top left vertex position y-coordinate
    }
  }

  /*
   * For showing one layer and hiding all others and reverse
   */
  focusOn(layer) {
    if (this.focusedLayer == '') {
      //If no layer is yet focused show only the from the param
      this.focusedLayer = layer;
      let s = this.structure.find(el => el.id == layer);
      let temp, temp2;

      //Hide all other layers and also disable the container labels on top of visualization in graph view
      this.structure.forEach(el => {
        temp = el.id;
        if (el.id != layer) {
          el.plane.p.visible = false;
          el.plane.b.forEach(el2 => (el2.visible = false));
          $('#' + temp.replace(/ |\||\(|\)/g, '')).addClass('disabled');
        }
      });

      //Hide all nodes that are on other layers than the currently highlighted one
      this.meshes.forEach(el => {
        if (el.userData.layer != layer) {
          el.visible = false;
        }
      });

      //Hide all edges that go to nodes that are not on the currently highlighted layer
      this.arrows.forEach(el => {
        temp =
          this.meshes.find(el2 => el2.userData.id == el.source).userData
            .layer == layer;
        temp2 =
          this.meshes.find(el2 => el2.userData.id == el.target).userData
            .layer == layer;
        if (!temp || !temp2) {
          el.arrow.line.visible = false;
          el.arrow.cone.visible = false;
        }
      });
    } else if (layer == this.focusedLayer) {
      //If there is already one layered focused reverse all action from above
      this.focusedLayer = '';
      let temp;
      //Show all layers again and reenable the labels on top of visualization in graph view
      this.structure.forEach(el => {
        temp = el.id;
        $('#' + temp.replace(/ |\||\(|\)/g, '')).removeClass('disabled');
      });

      //Show all layers again but only if settings.showAll=true
      if (this.showAllLayers) {
        this.structure.forEach(el => {
          if (el.id != layer) {
            el.plane.p.visible = true;
            el.plane.b.forEach(el2 => (el2.visible = true));
          }
        });
      }

      //Show all nodes again
      this.meshes.forEach(el => {
        el.visible = true;
      });

      //Show all edges again
      this.arrows.forEach(el => {
        el.arrow.line.visible = true;
        el.arrow.cone.visible = true;
      });
    }
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

    //Line on x-axis
    let geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(0.5, 0, 0)
    );
    this.zero.line1 = new THREE.Line(geometry, lineMat);

    //Line on y-axis
    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, -0.5, 0)
    );
    this.zero.line2 = new THREE.Line(geometry, lineMat);

    //Line on z-axis
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

  /*
   * Creates all nodes
   */
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
      mesh.userData = { id: node.id, onGrid: false };
      this.meshes.push(mesh);

      //Right now the position is set randomly on a layer (first on z-coordinate = 0 and afterwards
      //moved to different layer depth (z-depth))
      //This can be tweak to allow for any layout algorithm right here
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
      if (link.source != link.target) {
        this.createLink(link);
      }
    });
  }

  createLink(link) {
    let arrow, dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == link.source).position;
    destination = this.meshes.find(el => el.userData.id == link.target)
      .position;

    //Calculate direction vector from origin to destination for edge
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

  /*
   * to update a links position update its origin and destination
   */
  updateLink(arrowLink, source, target) {
    let dir, origin, destination, length;
    origin = this.meshes.find(el => el.userData.id == source).position;
    destination = this.meshes.find(el => el.userData.id == target).position;
    dir = new THREE.Vector3().subVectors(destination, origin);
    length = dir.length() - 0.2;

    arrowLink.position.copy(origin); //set new origin of line
    arrowLink.setDirection(dir.normalize()); //set new direction (towards destination) of line
    arrowLink.setLength(length, 0.4, 0.1);
  }

  /*
   * This updates all edges that are linked to the changed node
   */
  changeArrow(node) {
    let id = this.meshes.find(el => el == node).userData.id;
    this.arrows.forEach(el => {
      if (el.source == id) {
        //Either the edge points away from this node
        this.updateLink(el.arrow, id, el.target);
      } else if (el.target == id) {
        //Or it points toward this node
        this.updateLink(el.arrow, el.source, id);
      }
    });
  }

  /*
   * Inspiration for this mechanic of using an html element as a label on top of the canvas elements
   * from the force-graph and three-forcegraph packages (which are also built into this visualizer)
   * https://github.com/vasturiano/force-graph
   * https://github.com/vasturiano/3d-force-graph
   */
  updateLabelSpritePosition(x, y) {
    this.nodeLabel.css({ top: y, left: x + 30 });
  }

  /*
   * Select a node
   */
  select(node) {
    this.selected = node;
    this.outlinePassReference.selectedObjects = [this.selected];
    this.change('viewNode', node.userData.id); //pass new "selection" up through the vue components
  }

  /*
   * Deselect the currently selected node
   */
  deselect() {
    if (this.selected != null) {
      this.selected = null;
      this.outlinePassReference.selectedObjects = [];
      this.change('viewNode', -1); //pass new "selection" up through the vue components
    }
  }

  /*
   * This method is used to deselect the currently selected node when the user clicks anywhere on the canvas
   */
  switchSelect() {
    if (this.intersects.length == 0) {
      //Only deselect when the user clicks into the void
      this.deselect();
    }
  }

  /*
   * Deletes nodes from the gridPositions array
   */
  deleteNodeFromGrid(node) {
    if (node.userData.onGrid) {
      let ind = this.gridPositions.find(el => el.name == node.name);
      this.gridPositions.splice(ind, 1);
      node.userData.onGrid = false;
    }
  }

  /*
   * Check where a position should be put on a grid after is has been dropped
   */
  checkNodePositionOnGrid(node) {
    if (!this.snapToGrid) {
      //If settings.snapToGrid is off, don't put the node on the grid
      if (this.point == null) {
        this.selected.position.x = this.oldPos.x;
        this.selected.position.y = this.oldPos.y;
        this.selected.position.z = this.oldPos.z;
      }
      return;
    }

    let distance = this.stepSize * this.steps;
    //start with max value and narrow it down until horizontal and vertical line closest to node position has been found
    let x = Number.MAX_VALUE,
      y = Number.MAX_VALUE,
      xi = 0,
      yi = 0;
    let temp;
    for (let i = -distance; i <= distance; i += this.stepSize) {
      //check lines from left to right and bottom to top
      temp = Math.abs(i - node.position.x);
      if (temp < x) {
        x = temp;
        xi = i;
      }
      temp = Math.abs(i - node.position.y);
      if (temp < y) {
        y = temp;
        yi = i;
      }
    }
    this.positionNodeOnGrid(node, { x: xi, y: yi }, true); //Put node at calculated positon (or next best free position if this one is full)
  }

  /*
   * Recursive method to check for a free position on grid. If one is already full, check the ones around it clockwise.
   * If all 8 positions around are full, repeat first step clockwise at position top of this
   * The search params determines if the function should just check if the current position is free
   * or if there should be a clockwise search check performed for all grid positons around this one
   */
  positionNodeOnGrid(node, pos, search) {
    let checkIfOutOfBounds = pos => {
      let distance = this.steps * this.stepSize;
      return (
        pos.x > distance ||
        pos.x < -distance ||
        pos.y > distance ||
        pos.y < -distance
      );
    };

    if (search) {
      //If search=true do a clockwise check for all 8 positons around the current one
      if (this.checkGridPosition(pos.x, pos.y, node.userData.layer) < 0) {
        //If the current position is free, no clockwise check needed, just put the node there
        node.position.x = pos.x;
        node.position.y = pos.y;
        node.userData.onGrid = true;
        this.changeArrow(node);
        this.gridPositions.push(node);
        return true; //return true if node got placed on a position
      } else {
        //If current position is not free, start with clockwise checks
        let positions = [
          { x: pos.x, y: pos.y + 1 }, //top
          { x: pos.x + 1, y: pos.y + 1 }, //top right
          { x: pos.x + 1, y: pos.y }, //right
          { x: pos.x + 1, y: pos.y - 1 }, //bottom right
          { x: pos.x, y: pos.y - 1 }, //bottom
          { x: pos.x - 1, y: pos.y - 1 }, //bottom left
          { x: pos.x - 1, y: pos.y }, //left
          { x: pos.x - 1, y: pos.y + 1 } //top left
        ];
        for (let i = 0; i < positions.length; i++) {
          //Go through all 8 positions around this one clockwise and check for the first free one
          if (checkIfOutOfBounds(positions[i])) {
            continue;
          }
          if (this.positionNodeOnGrid(node, positions[i], false)) {
            //If one of these positions on grid is free, node got place there
            return true;
          }
        }
        //If none of the 8 positons on the grid around the current one are free,
        //perform the same clockwise checks around the next position
        let nextPos;
        for (let i = 0; i < positions.length; i++) {
          //Go through all 8 positions around this one clockwise and check for the first free one
          if (!checkIfOutOfBounds(positions[i])) {
            nextPos = positions[i];
            break;
          }
        }
        return this.positionNodeOnGrid(node, nextPos, true);
      }
    } else {
      //If search=false just check if the current position is free and if it is, place the node there
      if (this.checkGridPosition(pos.x, pos.y, node.userData.layer) < 0) {
        node.position.x = pos.x;
        node.position.y = pos.y;
        node.userData.onGrid = true;
        this.changeArrow(node);
        this.gridPositions.push(node);
        return true;
      } else {
        return false;
      }
    }
  }

  /*
   * Check if the position on the grid defined by params x and y
   * is free or not and if it is return the index of this position in the gridPositions array
   */
  checkGridPosition(x, y, layer) {
    for (let i = 0; i < this.gridPositions.length; i++) {
      if (
        this.gridPositions[i].userData.layer == layer &&
        this.gridPositions[i].position.x == x &&
        this.gridPositions[i].position.y == y
      ) {
        return i;
      }
    }
    return -1; //if this positon is free return -1
  }

  update(mouse) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, this.camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);

    //el.plane.p is normal plane (that also gets sized down in case of settings.slimLayers=true)
    //el.fullPlane is always at full size
    if (this.slimLayers) {
      //If layers are set to slim mouse ray intersection has to happen with fullPlane
      //and not the slim one to make it possible to drag node "out of" the slim layer
      this.planeIntersects = this.raycaster.intersectObjects(
        this.structure.map(el => el.fullPlane)
      );
    } else {
      this.planeIntersects = this.raycaster.intersectObjects(
        this.structure.map(el => el.plane.p)
      );
    }

    if (this.intersects.length > 0) {
      obj = this.intersects[0].object;
      this.hoverState(true, obj); //When hovering over a node show label, layer and grid
    } else if (!this.isDragging) {
      this.hoverState(false); //When hovering over a node show label, layer and grid
    }
  }
}
