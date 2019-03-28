import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./components/EntryPage.vue')
    },
    {
      path: '/admin',
      name: 'Administration',
      component: () => import('./components/Administration.vue')
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
      path: '/nodeEditor',
      name: 'Node Editor',
      component: () => import('./components/editors/nodeEditor/NodeEditor.vue')
    },
    {
      path: '/interactionEditor',
      name: 'Interaction Editor',
      component: () => import('./components/editors/interactionEditor/InteractionEditor.vue')
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
      component: () => import('./components/tools/TopicInspector.vue')
    },
    /* demos */
    {
      path: '/demos',
      name: 'Demos',
      component: () => import('./components/Demos.vue')
    },
    {
      path: '/demos/mouse-pointer',
      name: 'Demo - Mouse Pointer',
      component: () => import('./components/demos/DemoMousePointer.vue')
    },
    {
      path: '/demos/threejs',
      name: 'Demo - THREEjs',
      component: () => import('./components/demos/DemoThreejs.vue')
    },
  ]
})
