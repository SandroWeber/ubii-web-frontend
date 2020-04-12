import * as THREE from 'three';
import $ from 'jquery';
import { randomHexColor } from '../../utils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DragControls from 'three-dragcontrols';
import { RenderPass, EffectComposer, OutlinePass } from 'three-outlinepass';

/*
 * This is the super-class for the Grouped Graph
 * The reason this and the Layered Graph class aren't combined into one super-class
 * is because in the future it should be possible for a graph type to differ in the
 * way it builds its internal structure
 */
export class GroupedGraphScene {
  constructor(dataset, settings, renderer, camera, orbitControls) {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);
    this.type = 'GROUPED';
    this.dataset = dataset;
    this.structure = []; //The "interal structure" of a graph, can be whatever the current visualization / graphType chooses to focus on (e.g. layers, groups etc.)
    this.oldPos; //needed to check if selected node was actually dragged or only just clicked on to deselect it
    this.meshes = [];
    this.arrows = [];
    this.materials = [];
    this.selectedNode = null; //the currently selected nodes (with strg pressed)
    this.selected = []; //the currently selected node (settings.viewNode)
    this.intersects = null;
    this.same = false;
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
    this.steps = 4;
    this.hover = null;
    this.zero = {};
    this.createZeroMarker();
    this.selectKeyPressed = false;
    this.delete = null;

    this.change = null;
    this.camera = camera;

    this.orbitControls = orbitControls;

    this.dragControls = new DragControls(
      this.meshes,
      this.camera,
      document.getElementById('threejs-container')
    );

    this.dragControls.addEventListener(
      'dragstart',
      event => {
        this.dragstart(event);
      },
      false
    );
    this.dragControls.addEventListener(
      'dragend',
      event => {
        this.dragend(event);
      },
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
    outlinePass.hiddenEdgeColor.set(0x000000);

    this.setOutlinePass(outlinePass);
  }

  getScene() {
    return this.scene;
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

  setOutlinePass(outlinePass) {
    this.outlinePassReference = outlinePass;
  }

  setDragging(dragging) {
    this.isDragging = dragging;
    //The old position is needed to check if a node actually got dragged or only clicked on for deselecting
    this.oldPos = new THREE.Vector3().copy(this.selectedNode.position);
  }

  /*
   * binds reference for view label function in visualization-manager
   */
  setShowViewLabel(fct) {
    this.showViewLabel = fct;
  }

  /*
   * binds reference for change setting function in GraphView
   */
  setChange(change) {
    this.change = change;
  }

  /*
   * what happens to a node during dragging motion
   */
  dragBehaviour() {
    let distance = this.steps * this.stepSize;
    if (this.selectedNode.position.x > distance) {
      //max x distance / border while dragging
      this.selectedNode.position.x = distance;
    } else if (this.selectedNode.position.x < -distance) {
      this.selectedNode.position.x = -distance;
    }
    if (this.selectedNode.position.y > distance) {
      //max y distance / border while dragging
      this.selectedNode.position.y = distance;
    } else if (this.selectedNode.position.y < -distance) {
      this.selectedNode.position.y = -distance;
    }
    if (this.selectedNode.position.z > distance) {
      //max z distance / border while dragging
      this.selectedNode.position.z = distance;
    } else if (this.selectedNode.position.z < -distance) {
      this.selectedNode.position.z = -distance;
    }
  }

  /*
   * What happens during hover over node
   */
  hoverState(start, obj) {
    if (start) {
      //start=true to show label
      this.hover = obj;
      this.nodeLabel.show(); //this is the label that shows the nodes name and follows the mouse
      if (!obj.userData.isGroup) {
        //if node is not in group show label
        this.nodeLabel.html('Name: ' + obj.name);
      } else {
        this.nodeLabel.html(obj.name);
      }
    } else if (this.hover != null) {
      //start=false and hover object (set from first firing of this function) is existent
      this.hover = null;
      this.nodeLabel.hide();
    }
  }

  /*
   * this adds a new group to the structure of a visualization
   */
  addToStructure() {
    let c = randomHexColor(); //right now only random colors are choosen

    let id; //group-id is negative to put them into this.meshes
    //and still be able to differentiate them (group node) from normal meshes
    if (this.structure.length > 0) {
      //get next group-id from previous one
      id = this.structure[this.structure.length - 1].id;
      id = parseInt(id.substr(id.length - 2)) - 1;
    } else {
      id = -1;
    }

    let selected = this.selected.map(el => el.userData.id);

    let meshes = {};
    meshes.node = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 64, 64),
      new THREE.MeshLambertMaterial({
        color: c,
        transparent: true,
        opacity: 0.8
      })
    );

    this.selected.forEach(el => {
      el.userData.group = id;
      el.material.color.set(c);
    });

    let position = this.calcCentroid(this.selected); //get the centroid (3D center point) for the group node position

    let temp = new THREE.Vector3(position.x, position.y, position.z);

    meshes.node.userData.id = id;
    meshes.node.userData.isGroup = true;
    meshes.node.userData.group = '';
    meshes.node.name = 'Group' + id; //Using minus from negative group id as hyphen for group name

    this.meshes.push(meshes.node);
    this.scene.add(meshes.node);
    meshes.node.position.x = temp.x;
    meshes.node.position.y = temp.y;
    meshes.node.position.z = temp.z;

    meshes.arrowsIn = []; //the edges that go into a node that is now part of the group
    meshes.arrowsOut = []; //the edges that go out of a node that is now part of the group
    meshes.arrowsInside = []; //the edges that go between two nodes that are both now part of the group

    this.arrows.forEach(el => {
      let sin, tin;
      //check if source is in group
      if (selected.includes(el.source)) {
        sin = true;
      } else {
        sin = false;
      }

      //check if target is in group
      if (selected.includes(el.target)) {
        tin = true;
      } else {
        tin = false;
      }

      if (sin && tin) {
        //if source and target are in group, the whole edge is
        meshes.arrowsInside.push(el);
        el.arrow.line.visible = false;
        el.arrow.cone.visible = false;
      } else if (sin && !tin) {
        //if only source is in group, edge goes out of the group
        meshes.arrowsOut.push({ arrow: el, origin: el.source });
      } else if (!sin && tin) {
        //if only target is in group, edge goes into group
        meshes.arrowsIn.push({ arrow: el, origin: el.target });
      }
    });

    //make all nodes that are now part of the group invisible
    this.selected.forEach(el => {
      el.visible = false;
    });

    //hide all edges flowing to single nodes of group
    meshes.arrowsIn.forEach(el => {
      this.changeArrowWithNode(el.arrow, id, false);
    });

    //hide all edges flowing from single nodes of group
    meshes.arrowsOut.forEach(el => {
      this.changeArrowWithNode(el.arrow, id, true);
    });

    //create bounding box for group
    let geometry = new THREE.Geometry();
    //8 corner points of a 3D box
    geometry.vertices.push(
      new THREE.Vector3(1, -1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(-1, -1, 1),
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, 1, -1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, 1, 1)
    );

    //stitch triangular faces together to form a 3D box (2 triangle per side, 6 sides per box)
    //by connecting 3 vertices each by index to form one face
    geometry.faces.push(
      new THREE.Face3(0, 1, 2),
      new THREE.Face3(0, 2, 3),
      new THREE.Face3(0, 1, 5),
      new THREE.Face3(0, 4, 5),
      new THREE.Face3(3, 2, 6),
      new THREE.Face3(3, 7, 6),
      new THREE.Face3(3, 0, 4),
      new THREE.Face3(3, 7, 4),
      new THREE.Face3(2, 1, 5),
      new THREE.Face3(2, 6, 5),
      new THREE.Face3(4, 5, 6),
      new THREE.Face3(4, 7, 6)
    );

    let boundingBox = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: c,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      })
    );

    boundingBox.renderOrder = 1; //so that nodes inside the box are still visible
    this.scene.add(boundingBox);
    boundingBox.visible = false;

    meshes.box = boundingBox;

    this.structure.push({
      id: 'Group' + id,
      color: c,
      content: [...this.selected],
      max: {},
      visible: true,
      position: temp,
      meshes: meshes
    });

    this.calcBoundingBox(id);
  }

  /*
   * Calculate the center point from an array of points in 3D space
   * The centroid gets used as position for the group node
   */
  calcCentroid(points) {
    //Just simply add up for every coordinate and divide through number of points
    let position = { x: 0, y: 0, z: 0 };
    points.forEach(el => {
      position.x += el.position.x;
      position.y += el.position.y;
      position.z += el.position.z;
    });
    position.x /= points.length;
    position.y /= points.length;
    position.z /= points.length;
    return position;
  }

  /*
   * Remove a group from the visualization structure
   */
  deleteFromStructure(group) {
    let find = this.structure.find(el => el.meshes.node.userData.id == group);
    let index = this.structure.findIndex(el => el.id == group);
    find.content.forEach(el => {
      el.visible = true;
      el.userData.group = '';
      el.material.color.set('#FFFFFF');
    });

    //show all the individual ingoing edges again
    find.meshes.arrowsIn.forEach(el => {
      this.changeArrowWithNode(el.arrow, el.origin, false);
    });

    //show all the individual outgoing edges again
    find.meshes.arrowsOut.forEach(el => {
      this.changeArrowWithNode(el.arrow, el.origin, true);
    });

    //show all the individual inner (inside group) edges again
    find.meshes.arrowsInside.forEach(el => {
      el.arrow.line.visible = true;
      el.arrow.cone.visible = true;
    });

    this.scene.remove(find.meshes.box);

    this.delete = [find.meshes.node, index]; //deletion happens at dragend so temp. safe it for that
  }

  /*
   * Calulate the dimension of the bounding box of a group based on how far
   * the nodes of the group are spread out
   * This is reused everytime a node in the group changes position relative
   * to the other nodes in that group
   */
  calcBoundingBox(group) {
    //Three arrays to safe "farthest position in any direciton (x/y/u)"
    //index: 0 is for biggest positive coordinate
    //index: 1 is for smallest negative coordinate
    let x = [];
    let y = [];
    let z = [];
    let posX, posY, posZ; //these are temp positions for every cycle

    let find = this.structure.find(el => el.meshes.node.userData.id == group);

    //Go through all nodes and check if they are "the farthest out in any direction (x/y/z)"
    find.content.forEach(el => {
      posX = el.position.x;
      posY = el.position.y;
      posZ = el.position.z;

      //Check distance for x-axis
      if (x.length == 0) {
        x.push(posX);
      } else if (x.length == 1) {
        if (x[0] > posX) {
          //if this node's positive x coord is bigger than temp
          x.unshift(posX);
        } else {
          //if this node's negative x coord is smaller than temp
          x.push(posX);
        }
      } else {
        if (x[0] > posX) {
          //if this node's positive x coord is bigger than temp
          x[0] = posX;
        } else if (x[1] < posX) {
          //if this node's negative x coord is smaller than temp
          x[1] = posX;
        }
      }

      //Check distance for y-axis
      if (y.length == 0) {
        y.push(posY);
      } else if (y.length == 1) {
        if (y[0] > posY) {
          //if this node's positive y coord is bigger than temp
          y.unshift(posY);
        } else {
          //if this node's negative y coord is smaller than temp
          y.push(posY);
        }
      } else {
        if (y[0] > posY) {
          //if this node's positive y coord is bigger than temp
          y[0] = posY;
        } else if (y[1] < posY) {
          //if this node' negative y coord is smaller than temp
          y[1] = posY;
        }
      }

      //Check distance for z-axis
      if (z.length == 0) {
        z.push(posZ);
      } else if (z.length == 1) {
        if (z[0] > posZ) {
          //if this node's positive z coord is bigger than temp
          z.unshift(posZ);
        } else {
          //if this node's negative z coord is smaller than temp
          z.push(posZ);
        }
      } else {
        if (z[0] > posZ) {
          //if this node's positive z coord is bigger than temp
          z[0] = posZ;
        } else if (z[1] < posZ) {
          //if this node's negative z coord is smaller than temp
          z[1] = posZ;
        }
      }
    });

    //First index [0] is positive coordinate
    //Second index [1] is negative coordinate
    x[0] -= 0.2;
    x[1] += 0.2;
    y[0] -= 0.2;
    y[1] += 0.2;
    z[0] -= 0.2;
    z[1] += 0.2;

    //Updating x and y coordinate of every vertex of the group's
    //bounding box
    let g = find.meshes.box.geometry;
    g.verticesNeedUpdate = true;
    g.vertices[0].x = x[1];
    g.vertices[0].y = y[0];
    g.vertices[0].z = z[1];
    g.vertices[1].x = x[1];
    g.vertices[1].y = y[0];
    g.vertices[1].z = z[0];
    g.vertices[2].x = x[0];
    g.vertices[2].y = y[0];
    g.vertices[2].z = z[0];
    g.vertices[3].x = x[0];
    g.vertices[3].y = y[0];
    g.vertices[3].z = z[1];
    g.vertices[4].x = x[1];
    g.vertices[4].y = y[1];
    g.vertices[4].z = z[1];
    g.vertices[5].x = x[1];
    g.vertices[5].y = y[1];
    g.vertices[5].z = z[0];
    g.vertices[6].x = x[0];
    g.vertices[6].y = y[1];
    g.vertices[6].z = z[0];
    g.vertices[7].x = x[0];
    g.vertices[7].y = y[1];
    g.vertices[7].z = z[1];
  }

  /*
   * Opening a group or closing it again
   */
  focusOn(group) {
    let find = this.structure.find(el => el.id == group);

    find.visible = !find.visible; //reverse the current state (open -> closed) / (closed -> open)

    let v = find.visible; //smaller var name looks better

    find.content.forEach(el => {
      el.visible = !v;
    });

    find.meshes.node.visible = v; //group node
    find.meshes.box.visible = !v; //bounding box

    //ingoing individual edges
    find.meshes.arrowsIn.forEach(el => {
      if (v) {
        this.changeArrowWithNode(el.arrow, find.meshes.node.userData.id, false);
      } else {
        this.changeArrowWithNode(el.arrow, el.origin, false);
      }
    });

    //outgoing individual edges
    find.meshes.arrowsOut.forEach(el => {
      if (v) {
        this.changeArrowWithNode(el.arrow, find.meshes.node.userData.id, true);
      } else {
        this.changeArrowWithNode(el.arrow, el.origin, true);
      }
    });

    //inner edges (inside nodes in group)
    find.meshes.arrowsInside.forEach(el => {
      el.arrow.line.visible = !v;
      el.arrow.cone.visible = !v;
    });

    let temp;

    //label at the top
    this.structure.forEach(el => {
      temp = el.id;
      if (el.id == group) {
        if (v) {
          $('#' + temp.replace(/ |\|/g, '')).removeClass('enabled');
        } else {
          $('#' + temp.replace(/ |\|/g, '')).addClass('enabled');
        }
      }
    });
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
      mesh.userData = { id: node.id, isGroup: false, group: '' };
      this.meshes.push(mesh);

      //Right now the position is set randomly in 3D space
      //This can be tweak to allow for any layout algorithm right here
      mesh.position.set(
        THREE.Math.randFloat(-this.steps, this.steps),
        THREE.Math.randFloat(-this.steps, this.steps),
        THREE.Math.randFloat(-this.steps, this.steps)
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
  changeArrow(mesh) {
    let id = this.meshes.find(el => el == mesh).userData.id;
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
   * This is an intermediate function to change an edge that points into / out of a group
   * because than it has to point to the centroid of the group instead (or in the case of
   * an open group to the individual node)
   */
  changeArrowWithNode(arrow, id, changeSource) {
    //changeSource decides if updateLink() should reveice id param as 2nd or 3rd parameter
    //to change either the source (changeSource=true) or the target (changeSource=false)
    //of an edge
    if (changeSource) {
      this.updateLink(arrow.arrow, id, arrow.target);
      arrow.source = id;
    } else {
      this.updateLink(arrow.arrow, arrow.source, id);
      arrow.target = id;
    }
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
    this.selectedNode = node;
    if (
      this.selected.findIndex(el => el.userData.id == node.userData.id) == -1
    ) {
      //If node is not in selected array already, put it in
      this.selected.push(node);
    }
    this.outlinePassReference.selectedObjects = this.selected;
    this.change('viewNode', node.userData.id); //pass new "selection" up through the vue components
  }

  /*
   * Deselect a node
   */
  deselect(node) {
    if (this.selected.length > 0) {
      this.selectedNode = null;
      this.selected.splice(
        this.selected.findIndex(el => el.userData.id == node.userData.id),
        1
      );
      this.outlinePassReference.selectedObjects = this.selected;
      this.change('viewNode', -1); //pass new "selection" up through the vue components
    }
  }

  /*
   * This method is used to deselect all currently selected nodes when the user clicks anywhere on the canvas
   */
  switchSelect() {
    if (!this.isDragging && this.intersects.length == 0) {
      let temp = this.selected.slice();
      temp.forEach(el => this.deselect(el));
    }
  }

  update(mouse) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, this.camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);

    if (this.delete != null && !this.isDragging) {
      //Group gets deleted when dropping the group node after dragging
      this.scene.remove(this.delete[0]);
      let find = this.meshes.findIndex(
        el => el.userData.id == this.delete[0].userData.id
      );
      this.meshes.splice(find, 1);
      this.structure.splice(this.delete[1], 1);
      this.delete = null;
    }

    if (this.intersects.length > 0) {
      obj = this.intersects[0].object;
      this.hoverState(true, obj); //When hovering over a node show label
    } else if (!this.isDragging) {
      this.hoverState(false); //When hovering over a node show label
    }
  }
}
