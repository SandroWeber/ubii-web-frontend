import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./components/EntryPage.vue')
    },
    /* administration */
    {
      path: '/administration',
      name: 'Administration',
      component: () => import('./components/Administration.vue')
    },
    /* editors */
    {
      path: '/administration/nodeEditor',
      name: 'Node Editor',
      component: () => import('./components/editors/nodeEditor/NodeEditor.vue')
    },
    {
      path: '/administration/interactionEditor',
      name: 'Interaction Editor',
      component: () =>
        import('./components/editors/interactionEditor/InteractionEditor.vue')
    },
    {
      path: '/administration/sessionEditor',
      name: 'Session Editor',
      component: () =>
        import('./components/editors/sessionEditor/SessionEditor.vue')
    },
    /* interfaces */
    {
      path: '/interfaces',
      name: 'Interfaces',
      component: () => import('./components/Interfaces.vue')
    },
    {
      path: '/interfaces/smart-device',
      name: 'Interface - Smart Device',
      component: () => import('./components/interfaces/SmartDevice.vue')
    },
    {
      path: '/interfaces/myo',
      name: 'Interface - Myo',
      component: () => import('./components/interfaces/Myo.vue')
    },
    {
      path: '/interfaces/ubii-controller',
      name: 'Interface - Ubii Controller',
      component: () => import('./components/interfaces/UbiiController.vue')
    },
    {
      path: '/interfaces/ubii-game-pad',
      name: 'Interface - Ubii Gamepad',
      component: () => import('./components/interfaces/UbiiGamePad.vue')
    },
    {
      path: '/interfaces/ubii-game-camera',
      name: 'Interface - Ubii Game Camera',
      component: () => import('./components/interfaces/UbiiGameCamera.vue')
    },
    {
      path: '/interfaces/camera',
      name: 'Interface - Camera',
      component: () => import('./components/interfaces/Camera.vue')
    },
    /* tools */
    {
      path: '/tools',
      name: 'Tools',
      component: () => import('./components/Tools.vue')
    },
    {
      path: '/tools/topic-inspector',
      name: 'Topic Inspector',
      component: () => import('./components/tools/ServiceTopicInspector.vue')
    },
    {
      path: '/tools/performance_tests',
      name: 'Tool - Performance Tests',
      component: () => import('./components/tools/PerformanceTests.vue')
    },
    {
      path: '/tools/qrcode_display',
      name: 'Tool - QR Code Display',
      component: () => import('./components/tools/QRCodeDisplay.vue')
    },
    /* applications */
    {
      path: '/applications',
      name: 'Applications',
      component: () => import('./components/Applications.vue')
    },
    /* applications - visualization */
    {
      path: '/applications/visualization/3d_pose_visualizer',
      name: 'Application - 3D Pose Visualizer',
      component: () =>
        import('./components/applications/visualization/3DPoseVisualizer.vue')
    },
    /* applications - examples */
    {
      path: '/applications/examples/mouse-pointer',
      name: 'Example - Mouse Pointer',
      component: () =>
        import('./components/applications/examples/ExampleMousePointer.vue')
    },
    {
      path: '/applications/examples/threejs',
      name: 'Example - THREEjs',
      component: () =>
        import('./components/applications/examples/ExampleThreejs.vue')
    },
    {
      path: '/applications/examples/threejs-webvr',
      name: 'Example - THREEjs WebVR',
      component: () =>
        import('./components/applications/examples/ExampleThreejsWebVR.vue')
    },
    {
      path: '/applications/examples/aframe',
      name: 'Example - A-Frame',
      component: () =>
        import('./components/applications/examples/ExampleAframe.vue')
    },
    {
      path: '/applications/examples/gatherer-web-interface-smart-devices',
      name:
        'Example - Gathering from Smart Devices connected via Web Interface',
      component: () =>
        import(
          './components/applications/examples/ExampleWebInterfaceSmartDevices.vue'
        )
    },
    {
      path: '/applications/examples/opencv',
      name: 'Example - OpenCV',
      component: () => import('./components/applications/examples/OpenCV.vue')
    },
    {
      path: '/applications/examples/image-processing',
      name: 'Example - Image Processing',
      component: () =>
        import(
          './components/applications/examples/imageProcessing/ImageProcessing.vue'
        )
    },
    /* applications - smartphone VR */
    {
      path: '/applications/smartphone-assisted-vr/savr-model-inspector',
      name: 'VR Model Inspector - Inspect 3D Models',
      component: () =>
        import(
          './components/applications/smartphoneAssistedVR/SAVRModelInspector.vue'
        )
    },
    {
      path: '/applications/smartphone-assisted-vr/savr-laser-pointer',
      name: 'VR Laser Pointer - Select elements by pointing at them',
      component: () =>
        import(
          './components/applications/smartphoneAssistedVR/SAVRLaserPointer.vue'
        )
    },
    {
      path: '/applications/smartphone-assisted-vr/savr-keyboard',
      name: 'VR Keyboard - A virtual keyboard',
      component: () =>
        import(
          './components/applications/smartphoneAssistedVR/SAVRKeyboard.vue'
        )
    },
    {
      path: '/applications/misc/rock-paper-scissors',
      name: 'Rock Paper Scissors',
      component: () =>
        import('./components/applications/misc/RockPaperScissors.vue')
    }
  ]
});
