import Vue from 'vue'
import VueWorkflowEditor from '@/components/vue-workflow-editor'
// import Syn from 'syn'
// import sinon from 'sinon'

// function nextTick () {
//   return new Promise((resolve, reject) => Vue.nextTick(resolve))
// }
var node1 = null
var node2 = null
var node3 = null

function mount () {
  node1 = {
    id: 'id1',
    x: 100,
    y: 100,
    label: 'Status 100'
  }
  node2 = {
    id: 'id2',
    x: 400,
    y: 200,
    label: 'Status 2'
  }
  node3 = {
    id: 'id3',
    x: 200,
    y: 300,
    label: 'Status 3'
  }
  var props = {
    width: 600,
    height: 500,
    grid: [25, 25],
    value: {
      nodes: [node1, node2, node3],
      connections: [
        {
          id: 't_id1',
          from: 'id1',
          from_cp: 3,
          to: 'id2',
          to_cp: 7,
          label: 'from 1 to 2'
        },
        {
          id: 't_id1',
          from: 'id1',
          from_cp: 7,
          to: 'id3',
          to_cp: 4,
          label: 'from 1 to 3'
        },
        {
          id: 't_id123',
          from: 'id3',
          from_cp: 3,
          to: 'id1',
          to_cp: 4,
          label: 'from 3 to 1'
        }
      ]
    }
  }

  const Constructor = Vue.extend(VueWorkflowEditor)
  return new Constructor({propsData: props}).$mount()
}

// function simulate (el, event) {
//   var e = document.createEvent('HTMLEvents')
//   e.initEvent(event, true, true)
//   /* istanbul ignore else */
//   if ('get' in el && '0' in el && el.get(0)) {
//     el = el.get(0)
//   }
//   el.dispatchEvent(e)
// }

// describe('Hello.vue', () => {
//   it('should render correct contents', () => {
//     const Constructor = Vue.extend(Hello)
//     const vm = new Constructor().$mount()
//     expect(vm.$el.querySelector('.hello h1').textContent)
//       .to.equal('Welcome to Your Vue.js App')
//   })
// })

describe('VueDraggableResizable.vue', function () {
  /***********
   * Generic *
   ***********/

  it('should render correctly', done => {
    const vm = mount()

    expect(vm.$el).to.be.ok
    expect(vm.$el.className).to.contain('vueWorkflowEditor')

    expect(vm.$el.querySelector('input').value).to.contain('Add node')

    expect(vm.$el.querySelector('.svgContainer').width.animVal.value).to.equal(600)
    expect(vm.$el.querySelector('.svgContainer').height.animVal.value).to.equal(500)
    done()
  })

  it('should have 3 nodes', done => {
    const vm = mount()
    Vue.nextTick(() => {
      expect(vm.$el.querySelectorAll('.svgNodeGroup').length).to.equal(3)
      expect(vm.$el.querySelectorAll('.svgNodeRect').length).to.equal(3)
      expect(vm.$el.querySelectorAll('.svgNodeLabel').length).to.equal(3)
      done()
    })
  })

  it('should position the nodes correctly', done => {
    const vm = mount()
    Vue.nextTick(() => {
      expect(vm.$el.querySelector('#node-rect-id1').x.animVal.value).to.equal(node1.x)
      expect(vm.$el.querySelector('#node-rect-id1').y.animVal.value).to.equal(node1.y)
      expect(vm.$el.querySelector('#node-rect-id2').x.animVal.value).to.equal(node2.x)
      expect(vm.$el.querySelector('#node-rect-id2').y.animVal.value).to.equal(node2.y)
      expect(vm.$el.querySelector('#node-rect-id3').x.animVal.value).to.equal(node3.x)
      expect(vm.$el.querySelector('#node-rect-id3').y.animVal.value).to.equal(node3.y)
      done()
    })
  })

  it('should respond to changes in the model for the position', done => {
    const vm = mount()
    Vue.nextTick(() => {
      expect(vm.$el.querySelector('#node-rect-id1').x.animVal.value).to.equal(node1.x)
      expect(vm.$el.querySelector('#node-rect-id1').y.animVal.value).to.equal(node1.y)
      node1.x = 200
      node1.y = 300

      Vue.nextTick(() => {
        expect(vm.$el.querySelector('#node-rect-id1').x.animVal.value).to.equal(node1.x)
        expect(vm.$el.querySelector('#node-rect-id1').y.animVal.value).to.equal(node1.y)
        done()
      })
    })
  })

  // it('should activate a node on mouse click', done => {
  //   var vm = mount()
  //   Syn.click(vm.$el.querySelector('#node-rect-id1'))
  //
  // })

  // it('should update the model for nodes on dragging', done => {
  //   var vm = mount()
  //   // mount()
  //   // simulate(vm.$el.querySelector('#node-rect-id1'), 'mousedown')
  //
  //   Vue.nextTick(() => {
  //     vm.lastMouseX = 110
  //     vm.lastMouseY = 110
  //     expect(node1.x).to.equal(100)
  //     expect(node1.y).to.equal(100)
  //
  //     Syn.drag(vm.$el.querySelector('#node-rect-id1'),
  //       {
  //         from: {clientX: 10, clientY: 10},
  //         to: {clientX: 110, clientY: 60}
  //       },
  //       function () {
  //         Vue.nextTick(() => {
  //           expect(node1.x).to.equal(200)
  //           expect(node1.y).to.equal(150)
  //           done()
  //         })
  //       }
  //     )
  //   })
  // })
})
