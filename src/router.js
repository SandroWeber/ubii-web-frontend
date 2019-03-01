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
    /* web interfaces */
    {
      path: '/tools',
      name: 'Tools',
      component: () => import('./components/Tools.vue')
    },
    {
      path: '/tools/topic-inspector',
      name: 'Topic Inspector',
      component: () => import('./components/TopicInspector.vue')
    },
    {
      path: '/tools/demo-mouse-pointer',
      name: 'Demo: Mouse Pointer',
      component: () => import('./components/DemoMousePointer.vue')
    },
    {
      path: '/nodeEditor',
      name: 'Node Editor',
      component: () => import('./components/editors/nodeEditor/nodeEditor.vue')
    },
    {
      path: '/interactionEditor',
      name: 'Interaction Editor',
      component: () => import('./components/editors/interactionEditor/interactionEditor.vue')
    }
  ]
})
