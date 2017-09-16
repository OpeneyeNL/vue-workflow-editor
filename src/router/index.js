import Vue from 'vue'
import Router from 'vue-router'
import TestComponent from '@/components/TestComponent'
import WorkflowEditor from '@/components/WorkflowEditor'

Vue.use(Router)
Vue.use(TestComponent)
Vue.use(WorkflowEditor)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Workflow editor',
      component: WorkflowEditor
    }
  ]
})
