import * as THREE from 'three';
import $ from 'jquery';
import { Visualization1 } from './threejs-scenes';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DragControls from 'three-dragcontrols';
import { RenderPass, EffectComposer, OutlinePass } from "three-outlinepass";

export function setupThreejsEnvironment(domElement, dataset) {
  let state = {
    renderer: null,
    scene: null,
    scenes: [],
    camera: null,
    controls: [],
    mouse: {},
    composer: null,
    classification: [],
    stop: false
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

  state.camera =  new THREE.PerspectiveCamera(
    75,
    0.862,
    0.1,
    100
  );

  state.cancelVisualization = function() {
    document.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener('click', onClick, false);
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

  let onKeyDown = function(event) {
    let keyCode = event.which;
    if (keyCode == 88) {
      state.controls[0].reset();
      showViewLabel('X');
    } else if (keyCode == 89) {
      state.camera.position.set(-8, 0, 0);
      state.controls[0].update();
      showViewLabel('Y');
    } else if (keyCode == 49) {
      state.scenes[0].moveToLevel(0);
    } else if (keyCode == 50) {
      state.scenes[0].moveToLevel(1);
    } else if (keyCode == 51) {
      state.scenes[0].moveToLevel(2);
    } else if (keyCode == 52) {
      state.scenes[0].moveToLevel(3);
    } else if (keyCode == 53) {
      state.scenes[0].moveToLevel(4);
    } else if (keyCode == 54) {
      state.scenes[0].moveToLevel(5);
    } else if (keyCode == 55) {
      state.scenes[0].moveToLevel(6);
    } else if (keyCode == 56) {
      state.scenes[0].moveToLevel(7);
    } else if (keyCode == 57) {
      state.scenes[0].moveToLevel(8);
    }
  };

  let onMouseMove = function(event) {
    if(!state.stop) {
      let actualX = (event.clientX - $(domElement).offset().left);
      let actualY = (event.clientY - $(domElement).offset().top);
      state.mouse.x = (actualX / $(domElement).width()) * 2 - 1;
      state.mouse.y = -(actualY/ $(domElement).height()) * 2 + 1;

      state.scene.updateLabelSpritePosition(actualX, actualY);
    }
  };

  let onClick = function(event) {
    if(!state.stop) {
      state.scene.switchSelect();
    }
  };

  state.camera.position.z = 6;

  state.scenes.push(new Visualization1(dataset));
  state.scene = state.scenes[0];

  state.controls.push(new OrbitControls(state.camera, domElement));
  state.controls[0].keyPanSpeed = 20;
  state.controls[0].keys = {
    LEFT: 65,
    RIGHT: 68,
    UP: 87,
    BOTTOM: 83,
  };
  state.controls[0].screenSpacePanning = true;
  state.controls[0].addEventListener('change', () => showViewLabel(''));

  state.controls.push(new DragControls(state.scenes[0].meshes, state.camera, domElement));
  state.controls[1].addEventListener('dragstart', function(event) {
    state.controls[0].enabled = false;
    state.scenes[0].dragstart(event);
  });

  state.controls[1].addEventListener('dragend', function(event) {
    state.controls[0].enabled = true;
    state.scenes[0].dragend(event);
  });

  state.controls[1].addEventListener('drag', function(event) {
    state.scenes[0].detectLevel();
  });

  document.addEventListener("keydown", onKeyDown, false);
  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener('click', onClick, false);

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