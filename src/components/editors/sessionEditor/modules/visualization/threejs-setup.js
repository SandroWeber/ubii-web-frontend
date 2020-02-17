import * as THREE from 'three';
import $ from 'jquery';
import { Visualization1 } from './threejs-vis1';
import { Visualization2 } from './threejs-vis2';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DragControls from 'three-dragcontrols';
import { RenderPass, EffectComposer, OutlinePass } from "three-outlinepass";

export function setupThreejsEnvironment(domElement, dataset, view) {
  let state = {
    renderer: null,
    scene: null,
    scenes: [],
    camera: null,
    controls: [],
    mouse: {},
    composer: null,
    classification: [],
    stop: false,
    view: view,
    eventhandlerfunctions: []
  };

  let resizeRenderer = function() {
    let width = parseInt($(window).width()) - parseInt($('#side-bar').css('width'));
    let height = parseInt($('#side-bar').css('height'));
    $('#threejs-container').css('width', width);
    $('#threejs-container').css('height', height);
    state.renderer.setSize(width, height);
    state.composer.setSize(width, height);
    state.camera.aspect = $(domElement).width() / $(domElement).height();
    state.camera.updateProjectionMatrix();
  };

  let animate = function() {
    if(!state.stop){
      requestAnimationFrame(animate);
      state.scene.update(state.mouse, state.camera);
      // state.renderer.render(state.scene.getScene(), state.camera);
      state.composer.render(state.scene, state.camera);
    }
  };

  state.camera =  new THREE.OrthographicCamera(
    window.innerWidth / - 50, window.innerWidth / 50, window.innerHeight / 50, window.innerHeight / -50, 0, 100
  );
  state.camera.zoom = 4;

  state.cancelVisualization = function() {
    document.removeEventListener("keydown", state.eventhandlerfunctions[0], false);
    document.removeEventListener( 'mousemove', state.eventhandlerfunctions[1], false );
    document.removeEventListener('click', state.eventhandlerfunctions[2], false);
    state.controls[1].removeEventListener('dragstart', state.eventhandlerfunctions[3], false);
    state.controls[1].removeEventListener('dragend', state.eventhandlerfunctions[4], false);
    state.controls[1].removeEventListener('drag', state.eventhandlerfunctions[5], false);
    state.controls[1].removeEventListener('change', state.scene.drag, false);
    $(window).off('resize', resizeRenderer);
    state.stop = true;
    state.camera = null;
    state.composer = null;
    state.renderer = null;
    state.controls = null;
    state.mouse = null;
    state.scenes = null;
    state.scene = null;
    state.classification = null;
    $('#threejs-container canvas').remove();
  }

  let showViewLabel = function(view) {
    if(view == '') {
      $('#view-badge').html('View: 3D');
    } else {
      if(view == 'X') {
        $('#view-badge').html('View: X-Axis (Main)');
      } else {
        $('#view-badge').html('View: Y-Axis (Levels)');
      }
    }
  };

  state.eventhandlerfunctions[0] = function onKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 88) {
      state.controls[0].reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      state.camera.position.set(-8, 0, 0);
      state.controls[0].update();
      showViewLabel('Y');
    } else if (keyCode == 49) {
      state.scenes[0].moveTo(0);
    } else if (keyCode == 50) {
      state.scenes[0].moveTo(1);
    } else if (keyCode == 51) {
      state.scenes[0].moveTo(2);
    } else if (keyCode == 52) {
      state.scenes[0].moveTo(3);
    } else if (keyCode == 53) {
      state.scenes[0].moveTo(4);
    } else if (keyCode == 54) {
      state.scenes[0].moveTo(5);
    } else if (keyCode == 55) {
      state.scenes[0].moveTo(6);
    } else if (keyCode == 56) {
      state.scenes[0].moveTo(7);
    } else if (keyCode == 57) {
      state.scenes[0].moveTo(8);
    }
  };

  state.eventhandlerfunctions[1] = function onMouseMove(event) {
    if(!state.stop) {
      let actualX = (event.clientX - $(domElement).offset().left);
      let actualY = (event.clientY - $(domElement).offset().top);
      state.mouse.x = (actualX / $(domElement).width()) * 2 - 1;
      state.mouse.y = -(actualY/ $(domElement).height()) * 2 + 1;

      state.scene.updateLabelSpritePosition(actualX, actualY);
    }
  };

  state.eventhandlerfunctions[2] = function onClick(event) {
    if(!state.stop) {
      state.scene.switchSelect();
    }
  };

  state.camera.position.z = 6;

  switch(view) {
    case 1:
      state.scenes.push(new Visualization1(dataset));
      break;
    case 2:
      state.scenes.push(new Visualization2(dataset));
      break;
  }
  state.scene = state.scenes[0];

  state.controls.push(new OrbitControls(state.camera, domElement));
  state.controls[0].keyPanSpeed = 20;
  state.controls[0].keys = {
    LEFT: 65,
    RIGHT: 68,
    UP: 87,
    BOTTOM: 83,
  };

  state.eventhandlerfunctions[3] = function change() { showViewLabel('') };
  state.eventhandlerfunctions[4] = function dragstart(event) {
    state.controls[0].enabled = false;
    state.scenes[0].dragstart(event);
  };
  state.eventhandlerfunctions[5] =  function dragend(event) {
    state.controls[0].enabled = true;
    state.scenes[0].dragend(event);
  };
  state.controls[0].screenSpacePanning = true;
  state.controls[0].addEventListener('change', state.eventhandlerfunctions[3], false);
  state.controls.push(new DragControls(state.scenes[0].meshes, state.camera, domElement));
  state.controls[1].addEventListener('dragstart', state.eventhandlerfunctions[4], false);
  state.controls[1].addEventListener('dragend', state.eventhandlerfunctions[5], false);
  state.controls[1].addEventListener('drag', state.scene.drag.bind(state.scene), false);

  document.addEventListener("keydown", state.eventhandlerfunctions[0], false);
  document.addEventListener( 'mousemove', state.eventhandlerfunctions[1], false );
  document.addEventListener('click', state.eventhandlerfunctions[2], false);

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  domElement.appendChild(state.renderer.domElement);
  state.renderer.setClearColor(0x19181A, 1);
  state.composer = new EffectComposer(state.renderer);
  resizeRenderer();
  $(window).resize(resizeRenderer);
  let renderPass = new RenderPass(state.scene.getScene(), state.camera);
  let outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), state.scene.getScene(), state.camera);
  outlinePass.renderToScreen = true;
  outlinePass.selectedObjects = state.scene.selected;

  state.composer.addPass(renderPass);
  state.composer.addPass(outlinePass);

  outlinePass.edgeStrength = 8;
  outlinePass.edgeGlow = 0;
  outlinePass.visibleEdgeColor.set(0xffe62b);
  outlinePass.hiddenEdgeColor.set(0x000000);

  state.scene.setOutlinePass(outlinePass);

  animate();

  return state;
}