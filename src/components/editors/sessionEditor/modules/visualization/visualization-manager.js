import * as THREE from 'three';
import $ from 'jquery';
import { Visualizations } from './graph-scenes';
import { checkIfCylic } from '../utils';
import { twoDForceGraphVis } from './2d-force-graph';
import { threeDForceGraphVis } from './3d-force-graph';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class VisualizationManager {
  constructor(dataset, settings, change) {
    this.render = null;
    this.scene = null;
    this.scenes = [];
    this.mouse = { x: 0, y: 0 };
    this.force_2d = null;
    this.force_3d = null;
    this.stop = true;
    this.dataset = dataset;
    this.settings = settings;
    this.change = change;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    $('#threejs-container').append(this.renderer.domElement);
    this.renderer.setClearColor(0x19181a, 1);

    this.resizeRenderer()();
    $(window).resize(this.resizeRenderer());

    this.camera = new THREE.OrthographicCamera(
      window.innerWidth / -50,
      window.innerWidth / 50,
      window.innerHeight / 50,
      window.innerHeight / -50,
      -20,
      100
    );
    this.camera.zoom = 4;

    this.camera.position.z = 6;

    this.orbitControls = new OrbitControls(
      this.camera,
      document.getElementById('threejs-container')
    );
    this.orbitControls.keyPanSpeed = 20;
    this.orbitControls.keys = {
      LEFT: 65,
      RIGHT: 68,
      UP: 87,
      BOTTOM: 83
    };
    this.orbitControls.screenSpacePanning = true;

    this.orbitControls.addEventListener(
      'change',
      event => {
        this.showViewLabel.bind(this, '');
      },
      false
    );

    document.addEventListener(
      'keydown',
      event => {
        this.onKeyDown.call(this, event);
      },
      false
    );
    document.addEventListener(
      'keyup',
      event => {
        this.onKeyUp.call(this, event);
      },
      false
    );
    document.addEventListener(
      'mousemove',
      event => {
        this.onMouseMove.call(this, event);
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

  onKeyDown(event) {
    if (!this.stop) {
      this.scene.onKeyDown(event, this.showViewLabel());
    }
  }

  onKeyUp(event) {
    if (!this.stop) {
      this.scene.onKeyUp(event);
    }
  }

  onMouseMove(event) {
    if (!this.stop && this.scene != null) {
      let actualX = event.clientX - $('#threejs-container').offset().left;
      let actualY = event.clientY - $('#threejs-container').offset().top;
      this.mouse.x = (actualX / $('#threejs-container').width()) * 2 - 1;
      this.mouse.y = -(actualY / $('#threejs-container').height()) * 2 + 1;

      this.scene.updateLabelSpritePosition(actualX, actualY);
    }
  }

  changeSetting(setting, value) {
    let scene = this.scenes.find(
      el => el.id == this.settings.sceneId && el.type == this.settings.graphType
    );
    if (scene == undefined) {
      return;
    }

    switch (setting) {
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
          if (this.settings.viewNode >= 0) {
            scene.select(
              scene.meshes.find(el => el.userData.id == this.settings.viewNode)
            );
          }
        }
        break;
      case 'dataset':
        this.dataset = value;
        for (let i = 0; i < this.scenes.length; i++) {
          this.deleteScene(this.scenes[i]);
        }
        this.scenes = [];
        this.showScene();
        break;
    }
  }

  showScene() {
    $('#warning').hide();
    switch (this.settings.graphType) {
      case '2D-FORCE':
        $('#force-graph-container-2d').show();
        $('#force-graph-container-3d').hide();
        $('#threejs-container').hide();
        if (this.force_2d == null) {
          this.force_2d = twoDForceGraphVis(
            $('#force-graph-container-2d'),
            this.change
          )(JSON.parse(JSON.stringify(this.dataset)));
        } else {
          this.force_2d.resumeAnimation();
        }
        this.stop = true;
        break;
      case '3D-FORCE':
        $('#force-graph-container-3d').show();
        $('#force-graph-container-2d').hide();
        $('#threejs-container').hide();
        if (this.force_3d == null) {
          this.force_3d = threeDForceGraphVis(
            $('#force-graph-container-3d'),
            this.change
          )(JSON.parse(JSON.stringify(this.dataset)));
        } else {
          this.force_3d.resumeAnimation();
        }
        this.stop = true;
        break;
      default:
        this.stop = false;
        this.pauseDragControls();
        this.scene = this.scenes.find(
          el =>
            el.id == this.settings.sceneId && el.type == this.settings.graphType
        );

        if (this.force_2d != null) {
          this.force_2d.pauseAnimation();
        }
        if (this.force_3d != null) {
          this.force_3d.pauseAnimation();
        }
        $('#force-graph-container-2d').hide();
        $('#force-graph-container-3d').hide();
        $('#threejs-container').show();

        if (this.scene == undefined) {
          this.addScene();
        }
        this.scene.dragControls.enabled = true;
        break;
    }
  }

  addScene() {
    let visualization, scene;
    switch (this.settings.graphType) {
      case 'LAYERED':
        if (this.settings.sceneId == 'STEPS' && checkIfCylic(this.dataset)) {
          $('#warning').show();
          this.structure = [];
          return;
        }
        visualization = Visualizations.find(
          el => (el.type = this.settings.graphType)
        );
        scene = visualization.scenes.find(el => el.id == this.settings.sceneId);
        this.scene = new scene.scene(
          this.dataset,
          this.settings,
          this.renderer,
          this.camera,
          this.orbitControls
        );
        this.scenes.push(this.scene);
        this.changeSetting('showAll');
        this.changeSetting('slimLayers');
        break;
      case 'GROUPED':
        visualization = Visualizations.find(
          el => el.type == this.settings.graphType
        );
        scene = visualization.scenes.find(el => el.id == 'BASIC');
        this.scene = new scene.scene(
          this.dataset,
          this.settings,
          this.renderer,
          this.camera,
          this.orbitControls
        );
        this.scenes.push(this.scene);
        break;
    }
    this.changeSetting('viewZeroMarker');
    this.scene.setChange(this.change);
    this.scene.setShowViewLabel(this.showViewLabel());
    this.stop = false;
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
    scene.raycaster = null;
    scene.composer = null;
    scene.scene = null;
    return index;
  }

  removeScene(index) {
    this.scenes.splice(index, 1);
  }

  test() {
    console.log('a');
  }

  pauseDragControls() {
    this.scenes.forEach(el => {
      el.dragControls.enabled = false;
    });
  }

  resizeRenderer() {
    return () => {
      let width =
        parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
      let height = parseInt($('#side-bar').css('height')) - 200;
      $('#threejs-container')
        .first()
        .css('width', width);
      $('#threejs-container')
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
      this.renderer.setSize(width, height);
      this.scene.composer.setSize(width, height);
      this.camera.aspect =
        $('#threejs-container').width() / $('#threejs-container').height();
      this.camera.updateProjectionMatrix();
    };
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.stop) {
      return;
    }
    this.scene.update(this.mouse);
    this.scene.composer.render(this.scene.scene, this.camera);
  }

  showViewLabel(view) {
    return () => {
      if (view == '') {
        $('#view-badge').html('View: 3D');
      } else {
        if (view == 'X') {
          $('#view-badge').html('View: X-Axis (Main)');
        } else {
          $('#view-badge').html('View: Y-Axis (Levels)');
        }
      }
    };
  }
}
