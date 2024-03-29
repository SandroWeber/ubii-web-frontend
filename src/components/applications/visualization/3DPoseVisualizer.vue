<template>
  <div>
    <button id="button-send-testdata" @click="toggleTestData()">
      Toggle sending test data
    </button>
    <div
      id="example-threejs-webvr-render-container"
      class="render-container"
    ></div>
  </div>
</template>

<script>

import * as Three from 'three';
import uuidv4 from 'uuid/v4';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import WebVR from '../sharedModules/WebVR';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

export default {
  name: 'Pose3DVisualizer',
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      sendTestData: false
    };
  },
  beforeDestroy: function() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;

    UbiiClientService.instance.unsubscribeTopic(this.topicObjects, this.handle3DObjects);

    if (this.ubiiSessionGeneratePoseMovements) {
      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.ubiiSessionGeneratePoseMovements
      });
    }
  },
  methods: {
    createUbiiSpecs: function() {
      /* define topics used */
      this.topicObjects =
        '/' + UbiiClientService.instance.getClientID() + '/3d_pose_visualizer/objects';
      this.topicBoundingBox =
        '/' +
        UbiiClientService.instance.getClientID() +
        '/3d_pose_visualizer/bounding_box';
      this.topicGenerateNumberOfObjects =
        '/' +
        UbiiClientService.instance.getClientID() +
        '/3d_pose_visualizer/generate_number_of_objects';

      this.ubiiDevice = {
        name: '3DPoseVisualizer - Device',
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: this.topicBoundingBox,
            messageFormat: 'vector3',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: this.topicGenerateNumberOfObjects,
            messageFormat: 'double',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: this.topicObjects,
            messageFormat: 'ubii.dataStructure.Object3D',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          }
        ]
      };

      /* define session generating objects and randomly moving them */
      let processGenerateObjects = (input, output, state) => {
        state.boundingBoxSize = input.boundingBoxSize;

        if (state.boundingBoxSize === undefined) {
          return;
        }

        if (state.objects === undefined) {
          state.objects = [];
        }

        let targetNumberOfObjects = Math.floor(input.numberOfObjects) || 0;
        let currentNumberOfObjects = state.objects.length;
        if (targetNumberOfObjects > currentNumberOfObjects) {
          for (
            let i = 0;
            i < targetNumberOfObjects - currentNumberOfObjects;
            i++
          ) {
            state.objects.push({
              id: (currentNumberOfObjects + i).toString(),
              pose: {
                position: { x: 0, y: 0, z: 0 },
                quaternion: { x: 0, y: 0, z: 0, w: 0 }
              }
            });
          }
        } else if (targetNumberOfObjects < currentNumberOfObjects) {
          for (
            let i = 0;
            i < currentNumberOfObjects - targetNumberOfObjects;
            i++
          ) {
            state.objects.pop();
          }
        }

        let isWithinBoundingBox = position => {
          return (
            position.x > 0 &&
            position.x < state.boundingBoxSize.x &&
            position.y > 0 &&
            position.y < state.boundingBoxSize.y &&
            position.z > 0 &&
            position.z < state.boundingBoxSize.z
          );
        };

        let generateRandomMovement = (pose, tDelta) => {
          pose.position.x =
            pose.position.x + (Math.random() - 0.5) * tDelta * 0.001;
          pose.position.y =
            pose.position.y + (Math.random() - 0.5) * tDelta * 0.001;
          pose.position.z =
            pose.position.z + (Math.random() - 0.5) * tDelta * 0.001;

          pose.quaternion.x =
            pose.quaternion.x + (Math.random() - 0.5) * tDelta * 0.001;
          pose.quaternion.y =
            pose.quaternion.y + (Math.random() - 0.5) * tDelta * 0.001;
          pose.quaternion.z =
            pose.quaternion.z + (Math.random() - 0.5) * tDelta * 0.001;
          pose.quaternion.w =
            pose.quaternion.w + (Math.random() - 0.5) * tDelta * 0.001;

          if (!isWithinBoundingBox(pose.position)) {
            pose.position = { x: 1, y: 1, z: 1 };
          }
        };

        if (state.tLast === undefined) {
          state.tLast = Date.now();
        }
        let tNow = Date.now();
        let tDelta = tNow - state.tLast;
        if (tDelta < 100) {
          return;
        }
        state.objects.forEach(object => {
          generateRandomMovement(object.pose, tDelta);
          output.objectOutput = object;
        });
        state.tLast = tNow;
      };

      this.interactionGenerateObjects = {
        id: uuidv4(),
        name: '3DPoseVisualizer - generate random pose movement',
        processingCallback: processGenerateObjects.toString(),
        inputFormats: [
          {
            internalName: 'boundingBoxSize',
            messageFormat: 'vector3'
          },
          {
            internalName: 'numberOfObjects',
            messageFormat: 'double'
          }
        ],
        outputFormats: [
          {
            internalName: 'objectOutput',
            messageFormat: 'object3D'
          }
        ]
      };

      this.ubiiSessionGeneratePoseMovements = {
        id: uuidv4(),
        name: '3DPoseVisualizer - session random pose movement',
        interactions: [this.interactionGenerateObjects],
        ioMappings: [
          {
            interactionId: this.interactionGenerateObjects.id,
            inputMappings: [
              {
                name: this.interactionGenerateObjects.inputFormats[0]
                  .internalName,
                topicSource: this.topicBoundingBox
              },
              {
                name: this.interactionGenerateObjects.inputFormats[1]
                  .internalName,
                topicSource: this.topicGenerateNumberOfObjects
              }
            ],
            outputMappings: [
              {
                name: this.interactionGenerateObjects.outputFormats[0]
                  .internalName,
                topicDestination: this.topicObjects
              }
            ]
          }
        ]
      };
    },
    init: function() {
      let container = document.getElementById(
        'example-threejs-webvr-render-container'
      );

      this.scene = new Three.Scene();

      this.camera = new Three.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        10
      );
      this.camera.position.z = 1;
      this.scene.add(this.camera);

      this.renderer = new Three.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);

      container.appendChild(WebVR.createButton(this.renderer));
      this.renderer.vr.enabled = true;

      this.visualizedObjects = new Three.Object3D();
      this.scene.add(this.visualizedObjects);

      UbiiClientService.instance.waitForConnection().then(() => {
        this.createUbiiSpecs();

        UbiiClientService.instance.subscribeTopic(
          this.topicObjects,
          this.handle3DObjects
        );

        UbiiClientService.instance.registerDevice(this.ubiiDevice).then(response => {
          if (!response.id) {
            return;
          }

          // device registration successful
          this.ubiiDevice = response;

          UbiiClientService.instance.publishRecord({
            topic: this.topicBoundingBox,
            vector3: { x: 2, y: 2, z: 2 }
          });

          UbiiClientService.instance.publishRecord({
            topic: this.topicGenerateNumberOfObjects,
            double: 3
          });

          //this.toggleTestData();
        });
      });
    },
    animate: function() {
      const renderer = this.renderer;
      const scene = this.scene;
      const camera = this.camera;

      this.renderer.setAnimationLoop(function() {
        renderer.render(scene, camera);
      });
    },
    addObject: function(object) {
      let axesHelper = new Three.AxesHelper(0.25);
      axesHelper.name = object.id;
      this.visualizedObjects.add(axesHelper);

      return axesHelper;
    },
    toggleTestData: function() {
      this.sendTestData = !this.sendTestData;

      if (this.sendTestData) {
        UbiiClientService.instance.waitForConnection().then(() => {
          UbiiClientService.instance.callService({
            topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
            session: this.ubiiSessionGeneratePoseMovements
          });
        });
      } else {
        UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
          session: this.ubiiSessionGeneratePoseMovements
        });
        this.scene.remove(this.visualizedObjects);
        this.visualizedObjects = new Three.Object3D();
        this.scene.add(this.visualizedObjects);
      }
    },
    handle3DObjects: function(object) {
      let found = false;
      this.scene.traverseVisible(sceneObject => {
        if (found) return;
        if (sceneObject.name === object.id) {
          sceneObject.position.set(
            object.pose.position.x,
            object.pose.position.y,
            object.pose.position.z
          );
          sceneObject.quaternion.set(
            object.pose.quaternion.x,
            object.pose.quaternion.y,
            object.pose.quaternion.z,
            object.pose.quaternion.w
          );
          found = true;
        }
      });

      if (!found) {
        this.addObject(object);
      }
    }
  },
  mounted() {
    this.init();
    this.animate();
  }
};
</script>

<style scoped lang="stylus">
.render-container {
  height: 100%;
}
</style>
