import $ from 'jquery';
import { ForceGraphVis2D } from './2d-force-graph';
import { ForceGraphVis3D } from './3d-force-graph';
import { LayeredGroupedGraphVis } from './layered-grouped-graph';

export class VisualizationManager {
  constructor(
    dataset,
    settings,
    change,
    domLayeredGrouped,
    domForce2D,
    domForce3D
  ) {
    this.force_2d = null;
    this.force_3d = null;
    this.dataset = dataset;
    this.settings = settings;
    this.change = change;

    this.renderDOMLayeredGrouped = domLayeredGrouped;
    this.renderDOMForce2D = domForce2D;
    this.renderDOMForce3D = domForce3D;

    this.layeredGroupedGraphVis = new LayeredGroupedGraphVis(
      this.renderDOMLayeredGrouped,
      change,
      dataset
    );

    document.addEventListener(
      'keydown',
      event => {
        this.onKeyDown.call(this, event);
      },
      false
    );

    this.layeredGroupedGraphVis.orbitControls.addEventListener(
      'change',
      () => {
        this.showViewLabel('');
      },
      false
    );
  }

  changeSetting(setting, value) {
    let scene = this.layeredGroupedGraphVis.visualizations.find(
      el => el.id == this.settings.sceneId && el.type == this.settings.graphType
    );
    if (
      scene == undefined &&
      this.settings.graphType != '2D-FORCE' &&
      this.settings.graphType != '3D-FORCE' &&
      !this.layeredGroupedGraphVis.stop
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
        for (
          let i = 0;
          i < this.layeredGroupedGraphVis.visualizations.length;
          i++
        ) {
          this.deleteScene(this.layeredGroupedGraphVis.visualizations[i]);
        }
        this.layeredGroupedGraphVis.visualizations = [];
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
        this.renderDOMForce2D.show();
        this.renderDOMForce3D.hide();
        this.renderDOMLayeredGrouped.hide();
        if (this.force_2d == null) {
          //Initialize new 2d-force-graph
          this.force_2d = ForceGraphVis2D(this.renderDOMForce2D, this.change)(
            JSON.parse(JSON.stringify(this.dataset))
          );
        } else {
          this.force_2d.resumeAnimation();
        }
        this.layeredGroupedGraphVis.stop = true; //Pause other scenes
        break;
      case '3D-FORCE':
        this.renderDOMForce3D.show();
        this.renderDOMForce2D.hide();
        this.renderDOMLayeredGrouped.hide();
        if (this.force_3d == null) {
          //Initialize new 3d-force-graph
          this.force_3d = ForceGraphVis3D(this.renderDOMForce3D, this.change)(
            JSON.parse(JSON.stringify(this.dataset))
          );
        } else {
          this.force_3d.resumeAnimation();
        }
        this.layeredGroupedGraphVis.stop = true; //Pause other scenes
        break;
      default:
        this.layeredGroupedGraphVis.showScene(this.settings); //switches to the right scene based on graphType and sceneId

        if (this.force_2d != null) {
          this.force_2d.pauseAnimation();
        }
        if (this.force_3d != null) {
          this.force_3d.pauseAnimation();
        }
        this.renderDOMForce2D.hide();
        this.renderDOMForce3D.hide();
        this.renderDOMLayeredGrouped.show();

        break;
    }
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

  onKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 88) {
      //X-button for front view
      this.showViewLabel('X');
    } else if (keyCode == 89) {
      //Y-button for side view on layers
      this.showViewLabel('Y');
    }
  }
}
