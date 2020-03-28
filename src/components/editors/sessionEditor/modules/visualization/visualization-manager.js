import * as THREE from 'three';
import $ from 'jquery';
import { Visualizations } from './graph-scenes';
import { checkIfCylic } from '../utils';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DragControls from 'three-dragcontrols';
import { RenderPass, EffectComposer, OutlinePass } from 'three-outlinepass';

export class VisualizationManager {
  constructor(dataset, settings, change) {
    this.render = null;
    this.scene = null;
    this.scenes = [];
    this.mouse = null;
    this.stop = true;
    this.dataset = dataset;
    this.settings = settings;
    this.change = change;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    $('#threejs-container-layered').append(this.renderer.domElement);
    this.renderer.setClearColor(0x19181a, 1);

    this.resizeRenderer();
    $(window).resize(this.resizeRenderer);

    document.addEventListener(
      'keydown',
      event => {
        if (!this.stop) {
          this.scene.onKeyDown(event, showViewLabel);
        }
      },
      false
    );
    document.addEventListener(
      'keyup',
      event => {
        if (!this.stop) {
          this.scene.onKeyUp(event);
        }
      },
      false
    );
    document.addEventListener(
      'mousemove',
      event => {
        if (!this.stop) {
          let actualX = event.clientX - $('#threejs-container').offset().left;
          let actualY = event.clientY - $('#threejs-container').offset().top;
          this.mouse.x = (actualX / $('#threejs-container').width()) * 2 - 1;
          this.mouse.y = -(actualY / $('#threejs-container').height()) * 2 + 1;

          this.scene.updateLabelSpritePosition(actualX, actualY);
        }
      },
      false
    );
    document.addEventListener(
      'click',
      event => {
        if (!this.stop && event.toElement.nodeName == 'CANVAS') {
          this.scene.switchSelect();
        }
      },
      false
    );

    this.animate();
  }

  changeSetting(setting) {
    this.scene = this.scenes.find(
      el => el.id == this.settings.sceneId && el.type == this.settings.graphType
    );

    switch ((setting, value)) {
      case 'viewZeroMarker':
        if (
          this.settings.graphType == 'LAYERED' ||
          this.settings.graphType == 'GROUPED'
        ) {
          this.settings.viewZeroMarker
            ? scene.showZeroMarker()
            : scene.hideZeroMarker();
        }
        break;
      case 'startNode':
      case 'sorting':
        if (this.settings.graphType == 'LAYERED') {
          let ind = this.deleteScene();
          this.removeScene(ind);
          this.showScene();
        }
        break;
      case 'showAll':
        if (this.settings.graphType == 'LAYERED') {
          scene.setShowAll(this.settings.showAll);
        }
        break;
      case 'slimLayers':
        if (this.settings.graphType == 'LAYERED') {
          scene.setSlimLayers(this.settings.slimLayers);
        }
        break;
      case 'snapToGrid':
        if (this.settings.graphType == 'LAYERED') {
          scene.setSnapToGrid(this.settings.sorting);
        }
        break;
      case 'viewNode':
        if (
          this.settings.graphType == 'LAYERED' ||
          this.settings.graphType == 'GROUPED'
        ) {
          scene.select(
            scene.meshes.find(el => el.userData.id == this.settings.viewNode)
          );
        }
        break;
      case 'dataset':
        this.dataset = value;
        for (let i = 0; i < this.scenes; i++) {
          this.deleteScene(this.scenes[i]);
        }
        this.scenes = null;
        break;
    }
  }

  showScene() {
    $('#warning').hide();
    switch (this.settings.graphType) {
      case '2D-FORCE':
        $('#force-graph-container-2d').show();
        $('#threejs-container').hide();
        break;
      case '2D-FORCE':
        $('#force-graph-container-3d').show();
        $('#threejs-container').hide();
        break;
      default:
        this.stop = false;
        this.scene = this.scenes.find(
          el =>
            el.id == this.settings.sceneId && el.type == this.settings.graphType
        );

        $('#force-graph-container-2d').hide();
        $('#force-graph-container-3d').hide();
        $('#threejs-container').show();

        if (this.scene == undefined) {
          this.addScene();
        }
        break;
    }
  }

  addScene() {
    let visualization, scene;
    switch (this.settings.graphType) {
      case 'LAYERED':
        if (
          this.settings.sceneId == 'STEPS' &&
          this.checkIfCylic(this.dataset)
        ) {
          $('#warning').show();
          this.structure = [];
          return;
        }
        visualization = Visualizations.find(
          el => (el.type = this.settings.graphType)
        );
        scene = visualization.scenes.find(el => el.id == this.settings.sceneId);
        this.scene = new scene.scene(this.dataset, this.settings);
        this.changeSetting('showAll');
        this.changeSetting('slimLayers');
        break;
      case 'GROUPED':
        visualization = visualizations.find(
          el => (el.type = this.settings.graphType)
        );
        scene = visualization.scenes.find(el => el.id == 'BASIC');
        this.scene = new scene.scene(this.dataset, this.settings);
        break;
    }
    this.scene.setChange(change);
    this.scene.setShowViewLabel(this.showViewLabel);
  }

  deleteScene(scene) {
    let index;
    if (scene == undefined) {
      scene = this.scenes.find((el, ind) => {
        if (
          el.id == this.settings.sceneId &&
          el.type == this.settings.graphType
        ) {
          index = ind;
          return true;
        } else {
          return false;
        }
      });
    }

    scene.camera = null;
    scene.controls[0] = null;
    scene.controls[1] = null;
    scene = null;
    return index;
  }

  removeScene(index) {
    this.scenes.splice(index, 1);
  }

  resizeRenderer() {
    let width =
      parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
    let height = parseInt($('#side-bar').css('height')) - 200;
    $('.render-container')
      .first()
      .css('width', width);
    $('.render-container')
      .first()
      .css('height', height);
    if (width < 1800) {
      $('.main').css('width', width);
    } else {
      $('.main').css('width', '100%');
    }
    if (this.scene == null) {
      return;
    }
    this.scene.composer.setSize(width, height);
    this.scene.camera.aspect =
      $('#threejs-container').width() / $('#threejs-container').height();
    this.scene.camera.updateProjectionMatrix();
  }

  animate() {
    if (!this.stop) {
      requestAnimationFrame(animate);
      this.scene.update(this.mouse);
      this.composer.render(this.scene.scene, this.scene.camera);
    }
  }

  showViewLabel(view) {
    if (view == '') {
      $('#view-badge').html('View: 3D');
    } else {
      if (view == 'X') {
        $('#view-badge').html('View: X-Axis (Main)');
      } else {
        $('#view-badge').html('View: Y-Axis (Levels)');
      }
    }
  }
}
