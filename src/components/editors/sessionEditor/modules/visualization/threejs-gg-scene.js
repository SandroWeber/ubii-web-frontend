import * as THREE from 'three';
import $ from 'jquery';
import { randomHexColor } from '../utils';

export class GroupedGraphScene {
  constructor(dataset, snapToGrid) {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);
    this.type = 'GROUPED';
    this.dataset = dataset;
    this.structure = [];
    this.locked = { x: false, y: false, z: true };
    this.guideline = null;
    this.oldPos;
    this.meshes = [];
    this.arrows = [];
    this.materials = [];
    this.selectedNode = null;
    this.selected = [];
    this.levels = [];
    this.intersects = null;
    this.planeIntersects = null;
    this.same = false;
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
    this.stepSize = 1;
    this.steps = 4;
    this.layerStepSize = 3;
    this.hover = null;
    this.zero = {};
    this.createZeroMarker();
    this.showAllLayers = false;
    this.slimLayers = false;
    this.focusedLayer = '';
    this.gridPositions = [];
    this.snapToGrid = snapToGrid;
    this.change = null;
    this.selectKeyPressed = false;
    this.delete = null;
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
    this.oldPos = new THREE.Vector3().copy(this.selectedNode.position);
  }

  setChange(change) {
    this.change = change;
  }

  moveTo(node, level) {
    node.position.set(node.position.x, node.position.y, level);
    this.changeArrow(node);
  }

  focusOn(group) {
    this.structure.forEach();
    $('#' + temp.replace(/ |\|/g, '')).addClass('disabled');
  }

  dragBehaviour() {
    let distance = this.steps * this.stepSize;
    if (this.selectedNode.position.x > distance) {
      this.selectedNode.position.x = distance;
    } else if (this.selectedNode.position.x < -distance) {
      this.selectedNode.position.x = -distance;
    }
    if (this.selectedNode.position.y > distance) {
      this.selectedNode.position.y = distance;
    } else if (this.selectedNode.position.y < -distance) {
      this.selectedNode.position.y = -distance;
    }
    if (this.selectedNode.position.z > distance) {
      this.selectedNode.position.z = distance;
    } else if (this.selectedNode.position.z < -distance) {
      this.selectedNode.position.z = -distance;
    }
  }

  hoverState(start, obj) {
    if (start) {
      this.hover = obj;
      this.nodeLabel.show();
      if (!obj.userData.isGroup) {
        this.nodeLabel.html('Name: ' + obj.name);
      } else {
        this.nodeLabel.html(obj.name);
      }
    } else if (this.hover != null) {
      this.hover = null;
      this.nodeLabel.hide();
    }
  }

  addToStructure() {
    let c = randomHexColor();

    let id;
    if (this.structure.length > 0) {
      id = this.structure[this.structure.length - 1].id;
      id = parseInt(id.substr(id.length - 2)) - 1;
    } else {
      id = -1;
    }

    let rest = this.meshes.filter(el => {
      for (let i = 0; i < this.selected.length; i++) {
        if (this.selected[i].userData.id == el.userData.id) {
          return false;
        }
      }
    });

    rest.forEach(el => (el.visible = false));

    let selected = this.selected.map(el => el.userData.id);
    this.selected.forEach(el => (el.userData.group = id));

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

    let position = this.calcCentroid(this.selected);

    let temp = new THREE.Vector3(position.x, position.y, position.z);

    meshes.node.userData.id = id;
    meshes.node.userData.isGroup = true;
    meshes.node.userData.group = '';
    meshes.node.name = 'Group' + id;

    this.meshes.push(meshes.node);
    this.scene.add(meshes.node);
    meshes.node.position.x = temp.x;
    meshes.node.position.y = temp.y;
    meshes.node.position.z = temp.z;

    meshes.arrowsIn = [];
    meshes.arrowsOut = [];
    meshes.arrowsInside = [];

    this.arrows.forEach(el => {
      let sin, tin;
      if (selected.includes(el.source)) {
        sin = true;
      } else {
        sin = false;
      }
      if (selected.includes(el.target)) {
        tin = true;
      } else {
        tin = false;
      }
      if (sin && tin) {
        meshes.arrowsInside.push(el);
        el.arrow.line.visible = false;
        el.arrow.cone.visible = false;
      } else if (sin && !tin) {
        meshes.arrowsOut.push({ arrow: el, origin: el.source });
      } else if (!sin && tin) {
        meshes.arrowsIn.push({ arrow: el, origin: el.target });
      }
    });

    this.selected.forEach(el => {
      el.visible = false;
    });

    meshes.arrowsIn.forEach(el => {
      this.changeArrowWithNode(el.arrow, id, false);
    });

    meshes.arrowsOut.forEach(el => {
      this.changeArrowWithNode(el.arrow, id, true);
    });

    let geometry = new THREE.Geometry();
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

    boundingBox.renderOrder = 1;
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

  calcCentroid(points) {
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

  deleteFromStructure(group) {
    let find = this.structure.find(el => el.meshes.node.userData.id == group);
    let index = this.structure.findIndex(el => el.id == group);
    find.content.forEach(el => {
      el.visible = true;
      el.userData.group = '';
      el.material.color.set('#FFFFFF');
    });
    find.meshes.arrowsIn.forEach(el => {
      this.changeArrowWithNode(el.arrow, el.origin, false);
    });
    find.meshes.arrowsOut.forEach(el => {
      this.changeArrowWithNode(el.arrow, el.origin, true);
    });
    find.meshes.arrowsInside.forEach(el => {
      el.arrow.line.visible = true;
      el.arrow.cone.visible = true;
    });
    this.scene.remove(find.meshes.box);
    this.delete = [find.meshes.node, index];
  }

  calcBoundingBox(group) {
    let x = [];
    let y = [];
    let z = [];
    let posX, posY, posZ;

    let find = this.structure.find(el => el.meshes.node.userData.id == group);

    find.content.forEach(el => {
      posX = el.position.x;
      posY = el.position.y;
      posZ = el.position.z;
      if (x.length == 0) {
        x.push(posX);
      } else if (x.length == 1) {
        if (x[0] > posX) {
          x.unshift(posX);
        } else {
          x.push(posX);
        }
      } else {
        if (x[0] > posX) {
          x[0] = posX;
        } else if (x[1] < posX) {
          x[1] = posX;
        }
      }
      if (y.length == 0) {
        y.push(posY);
      } else if (y.length == 1) {
        if (y[0] > posY) {
          y.unshift(posY);
        } else {
          y.push(posY);
        }
      } else {
        if (y[0] > posY) {
          y[0] = posY;
        } else if (y[1] < posY) {
          y[1] = posY;
        }
      }
      if (z.length == 0) {
        z.push(posZ);
      } else if (z.length == 1) {
        if (z[0] > posZ) {
          z.unshift(posZ);
        } else {
          z.push(posZ);
        }
      } else {
        if (z[0] > posZ) {
          z[0] = posZ;
        } else if (z[1] < posZ) {
          z[1] = posZ;
        }
      }
    });

    x[0] -= 0.2;
    x[1] += 0.2;
    y[0] -= 0.2;
    y[1] += 0.2;
    z[0] -= 0.2;
    z[1] += 0.2;

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

  focusOnLayer(group) {
    let find = this.structure.find(el => el.id == group);
    find.visible = !find.visible;
    let v = find.visible;
    find.content.forEach(el => {
      el.visible = !v;
    });
    find.meshes.node.visible = v;
    find.meshes.box.visible = !v;
    find.meshes.arrowsIn.forEach(el => {
      if (v) {
        this.changeArrowWithNode(el.arrow, find.meshes.node.userData.id, false);
      } else {
        this.changeArrowWithNode(el.arrow, el.origin, false);
      }
    });
    find.meshes.arrowsOut.forEach(el => {
      if (v) {
        this.changeArrowWithNode(el.arrow, find.meshes.node.userData.id, true);
      } else {
        this.changeArrowWithNode(el.arrow, el.origin, true);
      }
    });
    find.meshes.arrowsInside.forEach(el => {
      el.arrow.line.visible = !v;
      el.arrow.cone.visible = !v;
    });
    let temp;
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
      mesh.userData = { id: node.id, isGroup: false, group: '' };
      this.meshes.push(mesh);
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

  changeArrowWithNode(arrow, id, changeSource) {
    if (changeSource) {
      this.updateLink(arrow.arrow, id, arrow.target);
      arrow.source = id;
    } else {
      this.updateLink(arrow.arrow, arrow.source, id);
      arrow.target = id;
    }
  }

  updateLabelSpritePosition(x, y) {
    this.nodeLabel.css({ top: y, left: x + 30 });
  }

  select(node) {
    this.selectedNode = node;
    if (
      this.selected.findIndex(el => el.userData.id == node.userData.id) == -1
    ) {
      this.selected.push(node);
    }
    this.outlinePassReference.selectedObjects = this.selected;
    this.change('viewNode', node.userData.id);
  }

  deselect(node) {
    if (this.selected.length > 0) {
      this.selectedNode = null;
      this.selected.splice(
        this.selected.findIndex(el => el.userData.id == node.userData.id),
        1
      );
      this.outlinePassReference.selectedObjects = this.selected;
      this.change('viewNode', -1);
    }
  }

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
      this.hoverState(true, obj);
    } else if (!this.isDragging) {
      this.hoverState(false);
    }
  }
}
