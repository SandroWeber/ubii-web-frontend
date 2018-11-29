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
      path: '/configuration',
      name: 'Server Configuration',
      component: () => import('./components/ServerConfiguration.vue')
    },
    /* web interfaces */
    {
      path: '/interfaces',
      name: 'Interfaces',
      component: () => import('./components/Interfaces.vue')
    },
    {
      path: '/interfaces/topic-inspector',
      name: 'Topic Inspector',
      component: () => import('./components/TopicInspector.vue')
    },
    {
      path: '/interfaces/demo-mouse-pointer',
      name: 'Demo: Mouse Pointer',
      component: () => import('./components/DemoMousePointer.vue')
    }
  ]
})
