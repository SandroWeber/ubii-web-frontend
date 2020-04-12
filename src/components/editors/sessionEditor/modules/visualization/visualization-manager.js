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

    this.resizeRenderer();
    $(window).resize(() => this.resizeRenderer());

    this.camera = new THREE.OrthographicCamera(
      window.innerWidth / -50,
      window.innerWidth / 50,
      window.innerHeight / 50,
      window.innerHeight / -50,
      0.1,
      1000
    );
    this.camera.zoom = 4;

    this.camera.position.z = 14;

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
        this.showViewLabel('');
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
          //Only send event when click happens on canvas
          this.scene.switchSelect();
        }
      },
      false
    );

    this.animate();
  }

  onKeyDown(event) {
    if (!this.stop) {
      this.scene.onKeyDown(event);
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
    if (
      scene == undefined &&
      this.settings.graphType != '2D-FORCE' &&
      this.settings.graphType != '3D-FORCE' &&
      !this.stop
    ) {
      return;
    }

    switch (setting) {
      case 'viewZeroMarker': //Change in setting: show or hide the zero marker
        if (
          this.settings.graphType == 'LAYERED' ||
          this.settings.graphType == 'GROUPED'
        ) {
          this.settings.viewZeroMarker
            ? scene.showZeroMarker()
            : scene.hideZeroMarker();
        }
        break;
      case 'startNode': //Change in setting: starting node for steps mode for traversal
      case 'sorting': //Change in setting: sorting for degree mode (number of incoming edges, outgoing edges or both)
        if (this.settings.graphType == 'LAYERED') {
          //This change cannot be done in the scene, the scene has to be built from scratch
          let ind = this.deleteScene();
          this.removeScene(ind);
          this.showScene();
        }
        break;
      case 'showAll': //Change in setting: should layers be displayed or the time or only on hover
        if (this.settings.graphType == 'LAYERED') {
          scene.setShowAll(this.settings.showAll);
        }
        break;
      case 'slimLayers': //Change in setting: should layers be displayed in full size or only in the size that they actually need
        if (this.settings.graphType == 'LAYERED') {
          scene.setSlimLayers(this.settings.slimLayers);
        }
        break;
      case 'snapToGrid': //Change in setting: should dragging and dropping a node put it on the grid automatically or not
        if (this.settings.graphType == 'LAYERED') {
          scene.setSnapToGrid(this.settings.snapToGrid);
        }
        break;
      case 'viewNode': //Change in setting: which node should be selected
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
      case 'dataset': //Change in setting: new dataset should be shown, which affects all scenes
        //This change cannot be done in the scene, the scene has to be built from scratch
        //Furthermore delete all scenes because they all have to be provided with the new dataset
        this.dataset = value;
        for (let i = 0; i < this.scenes.length; i++) {
          this.deleteScene(this.scenes[i]);
        }
        this.scenes = [];
        if (this.settings.graphType == '2D-FORCE' && this.force_2d != null) {
          //For the force-graph just call grahData() with new dataset
          this.force_2d.graphData(JSON.parse(JSON.stringify(this.dataset)));
        } else if (
          this.settings.graphType == '3D-FORCE' &&
          this.force_3d != null
        ) {
          //For the force-graph just call grahData() with new dataset
          this.force_3d.graphData(JSON.parse(JSON.stringify(this.dataset)));
        }
        this.showScene();
        break;
    }
  }

  /* 
  This methods switches betweens graphs types. This includes switching to 
  the 2d and 3d force graphs which have their own threejs render environment
  as well as switching between the other visualization scenes
  */
  showScene() {
    $('#warning').hide();
    switch (this.settings.graphType) {
      case '2D-FORCE':
        $('#force-graph-container-2d').show();
        $('#force-graph-container-3d').hide();
        $('#threejs-container').hide();
        if (this.force_2d == null) {
          //Initialize new 2d-force-graph
          this.force_2d = twoDForceGraphVis(
            $('#force-graph-container-2d'),
            this.change
          )(JSON.parse(JSON.stringify(this.dataset)));
        } else {
          this.force_2d.resumeAnimation();
        }
        this.stop = true; //Pause other scenes
        break;
      case '3D-FORCE':
        $('#force-graph-container-3d').show();
        $('#force-graph-container-2d').hide();
        $('#threejs-container').hide();
        if (this.force_3d == null) {
          //Initialize new 3d-force-graph
          this.force_3d = threeDForceGraphVis(
            $('#force-graph-container-3d'),
            this.change
          )(JSON.parse(JSON.stringify(this.dataset)));
        } else {
          this.force_3d.resumeAnimation();
        }
        this.stop = true; //Pause other scenes
        break;
      default:
        this.stop = false;
        this.pauseDragControls();
        this.scene = this.scenes.find(
          el =>
            el.id == this.settings.sceneId && el.type == this.settings.graphType
        ); //switches to the right scene based on graphType and sceneId

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
          //If a scene relating to this graphType and sceneId
          //hasn't been created yet, do that now
          this.addScene();
        }
        if (!this.stop) {
          this.scene.dragControls.enabled = true;
        }
        break;
    }
  }

  addScene() {
    let visualization, scene;
    switch (this.settings.graphType) {
      case 'LAYERED':
        if (this.settings.sceneId == 'STEPS' && checkIfCylic(this.dataset)) {
          //Check if acylic graph for steps mode
          $('#warning').show();
          this.stop = true;
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
        this.changeSetting('showAll'); //These have to be changed after constructor of scene
        this.changeSetting('slimLayers'); //These have to be changed after constructor of scene
        break;
      case 'GROUPED':
        visualization = Visualizations.find(
          el => el.type == this.settings.graphType
        );
        //Next line always searches for sceneId='MANUAL' for Grouped Graph because
        //that's the only one realized right now
        scene = visualization.scenes.find(el => el.id == 'MANUAL');
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
    this.scene.setChange(this.change); //These have to be changed after constructor of scene
    this.scene.setShowViewLabel(this.showViewLabel.bind(this)); //These have to be changed after constructor of scene
    this.stop = false; //stop would otherwise halt the animate function
  }

  /* 
  This function either deletes a parameter-given scene or deletes the one that is currently 
  selected via sceneId and graphType in settings object
  */
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
    scene.dragControls = null;
    scene.raycaster = null;
    scene.composer = null;
    scene.scene = null;
    return index;
  }

  removeScene(index) {
    this.scenes.splice(index, 1);
  }

  pauseDragControls() {
    this.scenes.forEach(el => {
      el.dragControls.enabled = false;
    });
  }

  resizeRenderer() {
    let width =
      parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
    let height =
      parseInt($('#side-bar').css('height')) -
      parseInt($('#settings-container').css('height'));
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
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  /*
   * Animates the currently selected scene (gets selected in showScene())
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.stop) {
      //The animation of a normal threejs scene(right now from Layered or Grouped Graph) can be stopped
      return; //Stopping the animation for example when one of the force-graphs is selected
    }
    this.scene.update(this.mouse);
    this.scene.composer.render(this.scene.scene, this.camera); //this.scene.scene always render the selected scene
  }

  showViewLabel(view) {
    if (view == '') {
      $('#view-badge').html('View: 3D');
    } else {
      if (view == 'X') {
        $('#view-badge').html('View: X-Axis (Front)');
      } else {
        if (this.settings.graphType == 'LAYERED') {
          $('#view-badge').html('View: Y-Axis (Layers)');
        } else {
          $('#view-badge').html('View: Y-Axis (Side)');
        }
      }
    }
  }
}
