import * as THREE from 'three';
import $ from 'jquery';
import { randomHexColor } from '../utils';

export class SceneVisualization {
  constructor(dataset, snapToGrid) {
    this.scene = new THREE.Scene();
    let light = new THREE.AmbientLight(0xadadad);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 1));
    this.scene.add(light);

    this.dataset = dataset;
    this.structure = [];
    this.locked = { x: false, y: false, z: true };
    this.guideline = null;
    this.oldPos;
    this.meshes = [];
    this.arrows = [];
    this.materials = [];
    this.selected = null;
    this.levels = [];
    this.intersects = null;
    this.planeIntersects = null;
    this.same = false;
    this.raycaster = new THREE.Raycaster();
    this.nodeLabel = $('#node-label');
    this.stepSize = 1;
    let temp = dataset.nodes.length * dataset.nodes.length;
    this.steps = temp < 16 ? 4 : temp/dataset.nodes.length;
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
  }

  setShowAll(showAll) {
    this.showAllLayers = showAll;
    this.structure.forEach(el => {
      el.plane.p.visible = showAll;
      el.plane.b.forEach(el => {
        el.visible = showAll;
      });
    });
  }

  setSlimLayers(slimLayers) {
    this.slimLayers = slimLayers;
    this.structure.forEach(el => {
      this.calculateLayerDimensions(el.id);
      this.setLayerDimensions(el.id);
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

  detectLevel(level) {
    throw new Error('Cannot call abstract method');
  }

  onKeyUp(event, controls) {}

  setOutlinePass(outlinePass) {
    this.outlinePassReference = outlinePass;
  }

  setDragging(dragging) {
    this.isDragging = dragging;
    this.oldPos = new THREE.Vector3().copy(this.selected.position);
  }

  setChange(change) {
    this.change = change;
  }

  moveTo(node, level) {
    node.position.set(node.position.x, node.position.y, level);
    this.changeArrow(node);
  }

  dragBehaviour() {
    this.point = null;
    this.point = this.planeIntersects.find(
      el => el.object.userData.id == this.selected.userData.level
    );
    if (this.point != null) {
      this.selected.position.x = this.point.point.x;
      this.selected.position.y = this.point.point.y;
      this.selected.position.z = this.point.point.z;
    } else {
      this.selected.position.x = this.oldPos.x;
      this.selected.position.y = this.oldPos.y;
      this.selected.position.z = this.oldPos.z;
    }
    let distance = this.steps * this.stepSize;
    if (this.selected.position.x > distance) {
      this.selected.position.x = distance;
    } else if (this.selected.position.x < -distance) {
      this.selected.position.x = -distance;
    }
    if (this.selected.position.y > distance) {
      this.selected.position.y = distance;
    } else if (this.selected.position.y < -distance) {
      this.selected.position.y = -distance;
    }
  }

  hoverState(start, obj) {
    if (start) {
      this.hover = obj;
      this.nodeLabel.show();
      this.nodeLabel.html('Name: ' + obj.name);
      if (this.hover.userData.level != '') {
        this.showLayer(obj.userData.level, true);
      }
    } else if (this.hover != null) {
      let layer = this.hover.userData.level;
      this.hover = null;
      this.nodeLabel.hide();
      this.showLayer(layer, false);
    }
  }

  showLayer(layer, show) {
    let structure = this.structure.find(el => el.id == layer);
    if (this.showAllLayers) {
      structure.plane.p.material.opacity = show ? 0.6 : 0.4;
    } else {
      structure.plane.p.visible = show;
      structure.plane.b.forEach(el => {
        el.visible = show;
      });
    }
    if (!show) {
      structure.plane.g.forEach(el => (el.visible = false));
    } else {
      structure.plane.g.forEach(el => {
        this.scene.remove(el);
        el.visible = false;
      });
      if (!this.slimLayers) {
        structure.plane.g = this.createGrid(
          this.stepSize * this.steps,
          structure.color
        );
        structure.plane.g.forEach(el => {
          el.visible = true;
          el.geometry.vertices[0].z = structure.depth;
          el.geometry.vertices[1].z = structure.depth;
        });
      } else {
        let lineMat = new THREE.LineBasicMaterial({
          color: structure.color
        });

        let grid = this.gridHelperMethod(
          {
            x: [structure.plane.x[0], structure.plane.x[1]],
            y: [structure.plane.y[0], structure.plane.y[1]]
          },
          lineMat
        );

        structure.plane.g = grid;

        structure.plane.g.forEach(el => {
          el.geometry.vertices[0].z = structure.depth;
          el.geometry.vertices[1].z = structure.depth;
          el.visible = false;
          this.scene.add(el);
        });

        let x, y;

        structure.plane.g.forEach(el => {
          if (el.userData.vertical) {
            x = el.geometry.vertices[0].x;
            if (x > structure.plane.x[1] && x < structure.plane.x[0]) {
              el.visible = true;
            }
          } else {
            y = el.geometry.vertices[0].y;
            if (y > structure.plane.y[1] && y < structure.plane.y[0]) {
              el.visible = true;
            }
          }
        });
      }
    }
  }

  addToStructure(id, color) {
    let c;
    if (color == undefined) {
      c = randomHexColor();
    } else {
      c = color;
    }

    let plane = this.createLayerPlane(c);

    let distance = this.steps * this.stepSize;
    let geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(distance, distance, 0),
      new THREE.Vector3(distance, -distance, 0),
      new THREE.Vector3(-distance, -distance, 0),
      new THREE.Vector3(-distance, distance, 0)
    );

    geometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3));

    let fullPlane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: color,
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

    this.calculateLayerDimensions(id);
    this.setLayerDimensions(id);
  }

  createLayerPlane(color) {
    let distance = this.steps * this.stepSize;
    let geometry = new THREE.Geometry();
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

    if (!this.showAllLevels) {
      plane.visible = false;
    }

    this.scene.add(plane);

    return {
      x: [distance, -distance],
      y: [distance, -distance],
      p: plane,
      b: this.createLayerPlaneBorder(distance, color),
      g: this.createGrid(distance, color)
    };
  }

  createLayerPlaneBorder(distance, color) {
    let border = [];
    let lineMat = new THREE.LineBasicMaterial({
      color: color
    });
    let geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(-distance, distance, 0),
      new THREE.Vector3(distance, distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));
    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(distance, distance, 0),
      new THREE.Vector3(distance, -distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));
    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(distance, -distance, 0),
      new THREE.Vector3(-distance, -distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));
    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(-distance, -distance, 0),
      new THREE.Vector3(-distance, distance, 0)
    );
    border.push(new THREE.Line(geometry, lineMat));
    border.forEach(el => this.scene.add(el));
    return border;
  }

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

  gridHelperMethod(dimensions, lineMat) {
    let distance = this.steps * this.stepSize;
    let grid = [],
      line;

    let geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(0, dimensions.y[0], 0),
      new THREE.Vector3(0, dimensions.y[1], 0)
    );
    line = new THREE.Line(geometry, lineMat);
    line.userData.vertical = true;
    grid.push(line);
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

    geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3(dimensions.x[0], 0, 0),
      new THREE.Vector3(dimensions.x[1], 0, 0)
    );
    line = new THREE.Line(geometry, lineMat);
    line.userData.vertical = false;
    grid.push(line);
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

  setLevelDepth(id, depth) {
    let find = this.structure.find(str => str.id == id);
    find.depth = depth;
    find.plane.p.position.z = depth;
    find.fullPlane.position.z = depth;
    find.plane.b.forEach(el => {
      el.geometry.verticesNeedUpdate = true;
      el.geometry.vertices[0].z = depth;
      el.geometry.vertices[1].z = depth;
    });
  }

  calculateLayerDimensions(level) {
    let x = [0, 0];
    let y = [0, 0];
    let structure = this.structure.find(el => el.id == level);
    structure.content.forEach(el => {
      if (el.position.x > 0) {
        if (el.position.x > x[0]) {
          x[0] = el.position.x;
        }
      } else {
        if (el.position.x < x[1]) {
          x[1] = el.position.x;
        }
      }
      if (el.position.y > 0) {
        if (el.position.y > y[0]) {
          y[0] = el.position.y;
        }
      } else {
        if (el.position.y < y[1]) {
          y[1] = el.position.y;
        }
      }
    });

    if (x[0] == 0 && x[1] == 0 && y[0] == 0 && y[1] == 0) {
      x[0] = this.stepSize * 1;
      x[1] = -this.stepSize * 1;
      y[0] = this.stepSize * 1;
      y[1] = -this.stepSize * 1;
    }

    structure.plane.x = x;
    structure.plane.y = y;
  }

  setLayerDimensions(level) {
    let distance = this.steps * this.stepSize;
    let s = this.structure.find(el => el.id == level);
    let g = s.plane.p.geometry;
    let bs = s.plane.b;
    g.verticesNeedUpdate = true;
    bs.forEach(el => (el.geometry.verticesNeedUpdate = true));
    if (!this.slimLayers) {
      let distance = this.steps * this.stepSize;
      g.vertices[0].x = distance;
      g.vertices[0].y = distance;
      g.vertices[1].x = distance;
      g.vertices[1].y = -distance;
      g.vertices[2].x = -distance;
      g.vertices[2].y = -distance;
      g.vertices[3].x = -distance;
      g.vertices[3].y = distance;
      g.vertices[0].z = g.vertices[0].z;
      g.vertices[1].z = g.vertices[1].z;
      g.vertices[2].z = g.vertices[2].z;
      g.vertices[3].z = g.vertices[3].z;
      bs[0].geometry.vertices[0].x = -distance;
      bs[0].geometry.vertices[0].y = distance;
      bs[0].geometry.vertices[1].x = distance;
      bs[0].geometry.vertices[1].y = distance;
      bs[1].geometry.vertices[0].x = distance;
      bs[1].geometry.vertices[0].y = distance;
      bs[1].geometry.vertices[1].x = distance;
      bs[1].geometry.vertices[1].y = -distance;
      bs[2].geometry.vertices[0].x = distance;
      bs[2].geometry.vertices[0].y = -distance;
      bs[2].geometry.vertices[1].x = -distance;
      bs[2].geometry.vertices[1].y = -distance;
      bs[3].geometry.vertices[0].x = -distance;
      bs[3].geometry.vertices[0].y = -distance;
      bs[3].geometry.vertices[1].x = -distance;
      bs[3].geometry.vertices[1].y = distance;
    } else {
      g.vertices[0].x = s.plane.x[0];
      g.vertices[0].y = s.plane.y[0];
      g.vertices[1].x = s.plane.x[0];
      g.vertices[1].y = s.plane.y[1];
      g.vertices[2].x = s.plane.x[1];
      g.vertices[2].y = s.plane.y[1];
      g.vertices[3].x = s.plane.x[1];
      g.vertices[3].y = s.plane.y[0];
      g.vertices[0].z = g.vertices[0].z;
      g.vertices[1].z = g.vertices[1].z;
      g.vertices[2].z = g.vertices[2].z;
      g.vertices[3].z = g.vertices[3].z;
      bs[0].geometry.vertices[0].x = s.plane.x[1];
      bs[0].geometry.vertices[0].y = s.plane.y[0];
      bs[0].geometry.vertices[1].x = s.plane.x[0];
      bs[0].geometry.vertices[1].y = s.plane.y[0];
      bs[1].geometry.vertices[0].x = s.plane.x[0];
      bs[1].geometry.vertices[0].y = s.plane.y[0];
      bs[1].geometry.vertices[1].x = s.plane.x[0];
      bs[1].geometry.vertices[1].y = s.plane.y[1];
      bs[2].geometry.vertices[0].x = s.plane.x[0];
      bs[2].geometry.vertices[0].y = s.plane.y[1];
      bs[2].geometry.vertices[1].x = s.plane.x[1];
      bs[2].geometry.vertices[1].y = s.plane.y[1];
      bs[3].geometry.vertices[0].x = s.plane.x[1];
      bs[3].geometry.vertices[0].y = s.plane.y[1];
      bs[3].geometry.vertices[1].x = s.plane.x[1];
      bs[3].geometry.vertices[1].y = s.plane.y[0];
    }
  }

  focusOnLayer(layer) {
    if (this.focusedLayer == '') {
      this.focusedLayer = layer;
      let s = this.structure.find(el => el.id == layer);
      let temp, temp2;
      this.structure.forEach(el => {
        temp = el.id;
        if (el.id != layer) {
          el.plane.p.visible = false;
          el.plane.b.forEach(el2 => (el2.visible = false));
          $('#' + temp.replace(/ |\|/g, '')).addClass('disabled');
        }
      });
      this.meshes.forEach(el => {
        if (el.userData.level != layer) {
          el.visible = false;
        }
      });
      this.arrows.forEach(el => {
        temp =
          this.meshes.find(el2 => el2.userData.id == el.source).userData
            .level == layer;
        temp2 =
          this.meshes.find(el2 => el2.userData.id == el.target).userData
            .level == layer;
        if (!temp || !temp2) {
          el.arrow.line.visible = false;
          el.arrow.cone.visible = false;
        }
      });
    } else if (layer == this.focusedLayer) {
      this.focusedLayer = '';
      let temp;
      this.structure.forEach(el => {
        temp = el.id;
        $('#' + temp.replace(/ |\|/g, '')).removeClass('disabled');
      });
      if (this.showAllLayers) {
        this.structure.forEach(el => {
          if (el.id != layer) {
            el.plane.p.visible = true;
            el.plane.b.forEach(el2 => (el2.visible = true));
          }
        });
      }
      this.meshes.forEach(el => {
        el.visible = true;
      });
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
      mesh.userData = { id: node.id, onGrid: false };
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
    this.selected = node;
    this.outlinePassReference.selectedObjects = [this.selected];
    this.change('viewNode', node.userData.id);
  }

  deselect() {
    if (this.selected != null) {
      this.selected = null;
      this.outlinePassReference.selectedObjects = [];
      this.change('viewNode', -1);
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

  switchSelect() {
    if (this.intersects.length == 0) {
      this.deselect();
    }
  }

  makeLevelsWide() {
    this.structure.forEach(
      el => (el.plane.scale.x = this.steps * this.stepSize * 2)
    );
    this.structure.forEach(
      el => (el.plane.scale.y = this.steps * this.stepSize * 2)
    );
  }

  deleteNodeFromGrid(node) {
    if (node.userData.onGrid) {
      let ind = this.gridPositions.find(el => el.name == node.name);
      this.gridPositions.splice(ind, 1);
      node.userData.onGrid = false;
    }
  }

  checkNodePositionOnGrid(node) {
    if (!this.snapToGrid) {
      if (this.point == null) {
        this.selected.position.x = this.oldPos.x;
        this.selected.position.y = this.oldPos.y;
        this.selected.position.z = this.oldPos.z;
      }
      return;
    }
    let distance = this.stepSize * this.steps;
    let x = Number.MAX_VALUE,
      y = Number.MAX_VALUE,
      xi = 0,
      yi = 0;
    let temp;
    for (let i = -distance; i <= distance; i += this.stepSize) {
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
    this.positionNodeOnGrid(node, { x: xi, y: yi }, true);
  }

  positionNodeOnGrid(node, pos, search) {
    if (search) {
      if (this.checkGridPosition(pos.x, pos.y, node.userData.level) < 0) {
        node.position.x = pos.x;
        node.position.y = pos.y;
        node.userData.onGrid = true;
        this.changeArrow(node);
        this.gridPositions.push(node);
        return true;
      } else {
        let positions = [
          { x: pos.x, y: pos.y + 1 },
          { x: pos.x + 1, y: pos.y + 1 },
          { x: pos.x + 1, y: pos.y },
          { x: pos.x + 1, y: pos.y - 1 },
          { x: pos.x, y: pos.y - 1 },
          { x: pos.x - 1, y: pos.y - 1 },
          { x: pos.x - 1, y: pos.y },
          { x: pos.x - 1, y: pos.y + 1 }
        ];
        for (let i = 0; i < positions.length; i++) {
          if (this.positionNodeOnGrid(node, positions[i], false)) {
            return true;
          }
        }
        return this.positionNodeOnGrid(node, positions[0], true);
      }
    } else {
      if (this.checkGridPosition(pos.x, pos.y, node.userData.level) < 0) {
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

  checkGridPosition(x, y, level) {
    for (let i = 0; i < this.gridPositions.length; i++) {
      if (
        this.gridPositions[i].userData.level == level &&
        this.gridPositions[i].position.x == x &&
        this.gridPositions[i].position.y == y
      ) {
        return i;
      }
    }
    return -1;
  }

  update(mouse, camera) {
    let obj, node;
    this.raycaster.setFromCamera(mouse, camera);
    this.intersects = this.raycaster.intersectObjects(this.meshes);
    if (this.slimLayers) {
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
      this.hoverState(true, obj);
    } else if (!this.isDragging) {
      this.hoverState(false);
    }
  }
}
