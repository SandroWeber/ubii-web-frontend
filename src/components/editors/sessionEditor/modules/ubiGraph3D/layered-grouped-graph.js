import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import $ from 'jquery';

import { Visualizations } from './graph-visualizations';

export class LayeredGroupedGraphVis {
  constructor(domElement, change, dataset) {
    this.domElement = domElement;
    this.change = change;
    this.dataset = dataset;

    this.scene = null;
    this.stop = true;
    this.visualizations = [];
    this.mouse = { x: 0, y: 0 };

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.domElement.append(this.renderer.domElement);
    this.renderer.setClearColor(0x19181a, 1);

    this.resizeRenderer();
    window.addEventListener('resize', () => this.resizeRenderer());
    this.domElement[0].addEventListener('resize', () => this.resizeRenderer());

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

    this.orbitControls = new OrbitControls(this.camera, this.domElement[0]);
    this.orbitControls.keyPanSpeed = 20;
    this.orbitControls.keys = {
      LEFT: 65,
      RIGHT: 68,
      UP: 87,
      BOTTOM: 83
    };
    this.orbitControls.screenSpacePanning = true;

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
        if (!this.stop && event.target.nodeName == 'CANVAS') {
          //Only send event when click happens on canvas
          this.scene.switchSelect();
        }
      },
      false
    );

    this.animate();
  }

  resizeRenderer() {
    if (this.scene == null) {
      return;
    }
    let width = parseInt(this.domElement.width());
    let height = parseInt(this.domElement.height());

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.scene.composer.setSize(width, height);
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

  showScene(settings) {
    this.stop = false;
    this.pauseDragControls();
    this.scene = this.visualizations.find(
      el => el.id == settings.sceneId && el.type == settings.graphType
    ); //switches to the right scene based on graphType and sceneId

    if (this.scene == undefined) {
      //If a scene relating to this graphType and sceneId
      //hasn't been created yet, do that now
      this.addScene(settings);
    }
    if (!this.stop) {
      this.scene.dragControls.enabled = true;
    }
  }

  addScene(settings) {
    let visualization, scene;
    switch (settings.graphType) {
      case 'LAYERED':
        if (settings.sceneId == 'STEPS' && this.dataset.isCyclic()) {
          //Check if acylic graph for steps mode
          $('#warning').show();
          this.stop = true;
          this.structure = [];
          return;
        }
        visualization = Visualizations.find(
          el => (el.type = settings.graphType)
        );
        scene = visualization.scenes.find(el => el.id == settings.sceneId);
        this.scene = new scene.scene(
          this.dataset,
          settings,
          this.renderer,
          this.camera,
          this.orbitControls
        );
        this.visualizations.push(this.scene);

        this.scene.setShowAll(settings.showAll);
        this.scene.setSlimLayers(settings.slimLayers);
        settings.viewZeroMarker
          ? this.scene.showZeroMarker()
          : this.scene.hideZeroMarker();
        break;
      case 'GROUPED':
        visualization = Visualizations.find(
          el => el.type == settings.graphType
        );
        //Next line always searches for sceneId='MANUAL' for Grouped Graph because
        //that's the only one realized right now
        scene = visualization.scenes.find(el => el.id == 'MANUAL');
        this.scene = new scene.scene(
          this.dataset,
          this.renderer,
          this.camera,
          this.orbitControls
        );
        this.visualizations.push(this.scene);
        break;
    }
    //this.changeSetting('viewZeroMarker');
    this.scene.setChange(this.change); //These have to be changed after constructor of scene
    //this.scene.setShowViewLabel(this.showViewLabel.bind(this)); //These have to be changed after constructor of scene
    this.stop = false; //stop would otherwise halt the animate function
  }

  /* 
    This function either deletes a parameter-given scene or deletes the one that is currently 
    selected via sceneId and graphType in settings object
    */
  deleteScene(scene) {
    let index;
    if (scene == undefined) {
      scene = this.visualizations.find((el, ind) => {
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
    this.visualizations.splice(index, 1);
  }

  pauseDragControls() {
    this.visualizations.forEach(el => {
      el.dragControls.enabled = false;
    });
  }

  // EVENT LISTENERS

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
      let actualX = event.clientX - this.domElement.offset().left;
      let actualY = event.clientY - this.domElement.offset().top;
      this.mouse.x = (actualX / this.domElement.width()) * 2 - 1;
      this.mouse.y = -(actualY / this.domElement.height()) * 2 + 1;

      this.scene.updateLabelSpritePosition(actualX, actualY);
    }
  }

  // EVENT LISTENERS END
}
