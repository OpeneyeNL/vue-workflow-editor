<template>
  <svg class="workflow-editor" id="svg1" :width="width" :height="height"
       @mousedown.prevent="evContainerMouseDown">
    <g v-for="connection in connections"
       v-show="activeConnection !== connection"
       class="connection"
       :class="{ hover: hoverConnection === connection }"
       @mouseover="hoverConnection=connection"
       @mouseleave="hoverConnection=null"
       @mousedown.stop.prevent="evActivateConnection($event, connection)">
      <path :d="connection.line"></path>
      <path class="fat" :d="connection.line"></path>
      <path class="arrow" :d="connection.arrow"></path>
    </g>

    <g @mouseover="hoverStartConnection=startConnection"
       @mouseleave="hoverStartConnection=null"
       v-show="activeConnection !== startConnection"
       class="connection"
       :class="{ hover: hoverStartConnection }"
       @mousedown.stop.prevent="evActivateConnection($event, startConnection)">
      <path :d="startConnection.line"></path>
      <path class="fat" :d="startConnection.line"></path>
      <path class="arrow" :d="startConnection.arrow"></path>
    </g>

    <g v-if="activeConnection" class="connection active">
      <path :d="calcPathFlow(activeConnection.cpFrom,activeConnection.cpTo)"></path>
      <path class="arrow" :d="calcArrow(activeConnection.cpTo)"></path>
    </g>

    <circle @mousedown.stop.prevent="evActivateStart()"
            r="20" class="node start" :cx="value.start.x" :cy="value.start.y">
    </circle>


    <g :id="'node-group-' + node.node.id"
       class="node"
       :class="{ active: activeNode === node }"
       v-for="node in nodes"
       @mouseover="hoverNode=node"
       @mouseout="hoverNode=null"
       @mousedown.stop.prevent="evActivateNode($event, node)">
      <rect :id="'node-rect-' + node.node.id"
            class="rectangle"
            :x="node.node.x" :y="node.node.y" rx="10" ry="10"
            :width="nodeWidth"
            :height="nodeHeight"></rect>
      <text :id="'node-text-' + node.node.id" class="label" :x="node.node.x + 10" :y="node.node.y + 30">
        {{ node.node.label }}
      </text>
    </g>

    <circle v-if="activeConnection" class="connection-point connector" r="5"
            :cx="activeConnection.cpTo.x"
            :cy="activeConnection.cpTo.y"
            @mousedown.stop.prevent="evStartDraggingActiveConnection(activeConnection.cpTo)"></circle>
    <circle v-if="activeConnection && activeConnection.connection.from !== '__START__'"
            class="connection-point connector"
            r="5"
            :cx="activeConnection.cpFrom.x"
            :cy="activeConnection.cpFrom.y"
            @mousedown.stop.prevent="evStartDraggingActiveConnection(activeConnection.cpFrom)"></circle>

    <path v-show="connecting" class="connection creating" :d="connectingLinePath"></path>

    <g v-show="hoverNode === node || connecting || reconnecting"
       v-for="node in nodes"
       @mouseover="hoverNode=node"
       @mouseout="hoverNode=null">
      <g class="connection-point" v-for="cp in node.connectionPoints"
         @mousedown.stop.prevent="evStartConnect($event, node.node, cp)"
         @mouseup.stop.prevent="evEndConnect($event, node.node, cp)"
         @mouseover="hoverNodeCp = cp"
         @mouseout="hoverNodeCp = null">
        <circle v-if="connecting || reconnecting" class="fat"
                :class="{ hover : hoverNodeCp === cp }" r="15" :cx="cp.x" :cy="cp.y"></circle>
        <circle r="5" :cx="cp.x" :cy="cp.y"></circle>
      </g>
    </g>
  </svg>
</template>

<script>
  export default {
    replace: true,
    name: 'vue-workflow-editor',
    props: {
      value: {
        type: Object
        // TODO validator with checks for nodes etc
      },
      width: {
        type: Number,
        default: 600,
        validator: function (val) {
          return val > 0
        }
      },
      height: {
        type: Number,
        default: 600,
        validator: function (val) {
          return val > 0
        }
      },
      nodeWidth: {
        type: Number,
        default: 150,
        validator: function (val) {
          return val > 0
        }
      },
      nodeHeight: {
        type: Number,
        default: 50,
        validator: function (val) {
          return val > 0
        }
      },
      connectionPoints: [
        {
          direction: 'u',
          percentage: 20
        },
        {
          direction: 'u',
          percentage: 50
        },
        {
          direction: 'u',
          percentage: 80
        },
        {
          direction: 'r',
          percentage: 50
        },
        {
          direction: 'd',
          percentage: 80
        },
        {
          direction: 'd',
          percentage: 50
        },
        {
          direction: 'd',
          percentage: 20
        },
        {
          direction: 'l',
          percentage: 50
        }
      ],
      draggable: {
        type: Boolean, default: true
      },
      resizable: {
        type: Boolean, default: true
      },
      grid: {
        type: Array,
        default: function () {
          return [1, 1]
        }
      },
      parent: {
        type: Boolean, default: false
      }
    },
    data: function () {
      return {
        activeNode: null,
        hoverNode: null,
        hoverNodeCp: null,
        dragging: false,
        connectingLinePath: 'M0,0',
        connecting: false,
        connectingFrom: null,
        activeConnection: null,
        hoverConnection: null,
        reconnecting: false,
        draggingConnectionPoint: null,
        hoverStartConnection: null,
        draggingStartPoint: false
      }
    },
    beforeCreate: function () {
    },
    created: function () {
      this.lastMouseX = 0
      this.lastMouseY = 0

      this.mouseX = 0
      this.mouseY = 0

      this.elmX = 0
      this.elmY = 0
    },
    mounted: function () {
      document.documentElement.addEventListener('mousemove', this.handleMove, true)
      document.documentElement.addEventListener('mouseup', this.handleUp, false)
      document.documentElement.addEventListener('keyup', this.evKeyUp, false)
    },
    beforeDestroy: function () {
      document.documentElement.removeEventListener('mousemove', this.handleMove, true)
      document.documentElement.removeEventListener('mouseup', this.handleUp, false)
      document.documentElement.removeEventListener('keyp', this.evKeyUp, false)
    },
    methods: {
      evActivateNode: function (e, node) {
        this.resetActiveElements()
        const target = e.target || e.srcElement
        if (this.$el.contains(target)) {
          this.activeNode = node
          this.elmX = node.node.x
          this.elmY = node.node.y

          if (this.draggable) {
            // console.log('start dragging')
            this.dragging = true
          }
          this.$emit('activatedNode', node)
        }
      },
      evActivateStart: function () {
        this.resetActiveElements()
        this.draggingStartPoint = true
        this.elmX = this.value.start.x
        this.elmY = this.value.start.y
      },
      resetActiveElements: function () {
        // console.log('resetting active elements')
        this.activeNode = null
        this.activeConnection = null
        this.draggingConnectionPoint = null
      },
      evContainerMouseDown: function () {
        this.resetActiveElements()
      },
      evKeyUp: function (e) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            this.deleteAction()
            break
          case 'Escape':
            this.resetActiveElements()
            break
        }
      },
      deleteAction: function () {
        // console.log('running delete')
        // TODO conditional
        if (this.activeConnection) {
          // delete it
          // console.log('deleting', this.activeConnection)
          const i = this.value.connections.indexOf(this.activeConnection.connection)
          if (i >= 0) {
            this.value.connections.splice(i, 1)
          }
          this.resetActiveElements()
        } else if (this.activeNode) {
          const nodeId = this.activeNode.node.id
          // delete it, along with all connections
          this.value.connections = this.value.connections.filter(function (connection) {
            return connection.from !== nodeId && connection.to !== nodeId
          })
          // console.log('deleting', this.activeNode)
          const i = this.value.nodes.indexOf(this.activeNode.node)
          if (i >= 0) {
            this.value.nodes.splice(i, 1)
          }
          this.resetActiveElements()
        }
      },
      evActivateConnection: function (e, connection) {
        this.resetActiveElements()
        console.log(connection)
        this.activeConnection = connection
      },
      resetActiveConnectionPoints: function () {
        this.activeConnection.cpFrom = this.connectionPoint(this.getNode(this.activeConnection.connection.from), this.activeConnection.connection.from_cp)
        this.activeConnection.cpTo = this.connectionPoint(this.getNode(this.activeConnection.connection.to), this.activeConnection.connection.to_cp)
      },
      evStartConnect: function (e, node, cp) {
        this.resetActiveElements()

        this.connecting = true
        this.connectingLinePath = 'M' + cp.x + ',' + cp.y

        this.connectingFrom = {node: node, cp: cp}
        this.elmX = cp.x
        this.elmY = cp.y
      },
      evEndConnect: function (e, node, cp) {
        if (this.connecting) {
          // now push the new connection
          this.connecting = false
          // do not accept to same point
          console.log(node, this.connectingFrom, cp, this.connectingFrom.cp)
          if (node === this.connectingFrom && cp === this.connectingFrom.cp) {
            // do nothing
          } else {
            this.value.connections.push(
              {
                id: Math.floor(Math.random() * 10000),
                from: this.connectingFrom.node.id,
                from_cp: this.connectingFrom.cp.id,
                to: node.id,
                to_cp: cp.id,
                label: 'New connection'
              })
          }
        }
        if (this.reconnecting) {
          // now reconnect
          this.reconnecting = false
          if (this.draggingConnectionPoint === this.activeConnection.cpFrom) {
            this.activeConnection.connection.from = node.id
            this.activeConnection.connection.from_cp = cp.id
          } else if (this.draggingConnectionPoint === this.activeConnection.cpTo) {
            this.activeConnection.connection.to = node.id
            this.activeConnection.connection.to_cp = cp.id
          }
          this.resetActiveConnectionPoints()
        }
      },
      evStartDraggingActiveConnection: function (cp) {
        this.draggingConnectionPoint = cp
        this.elmX = cp.x
        this.elmY = cp.y
        this.reconnecting = true
      },
      handleMove: function (e) {
        // get mouse position
        this.mouseX = e.pageX || e.clientX + document.documentElement.scrollLeft
        this.mouseY = e.pageY || e.clientY + document.documentElement.scrollTop

        // calc diff to previous position
        let diffX = this.mouseX - this.lastMouseX
        let diffY = this.mouseY - this.lastMouseY

        // save last position
        this.lastMouseX = this.mouseX
        this.lastMouseY = this.mouseY

        // calc the mouse pointer relative to the element that is moved
        this.elmX += diffX
        this.elmY += diffY

        // don't exceed limits
        if (this.elmX < 0) {
          this.elmX = 0
        }
        if (this.elmY < 0) {
          this.elmY = 0
        }
        if (this.elmX > this.width) {
          this.elmX = this.width
        }
        if (this.elmY > this.height) {
          this.elmY = this.height
        }

        if (this.dragging) {
          if (this.elmX > this.width - this.nodeWidth) {
            this.elmX = this.width - this.nodeWidth
          }
          if (this.elmY > this.height - this.nodeHeight) {
            this.elmY = this.height - this.nodeHeight
          }
          this.activeNode.node.x = (Math.round(this.elmX / this.grid[0]) * this.grid[0])
          this.activeNode.node.y = (Math.round(this.elmY / this.grid[1]) * this.grid[1])
        } else if (this.draggingStartPoint) {
          this.value.start.x = (Math.round(this.elmX / this.grid[0]) * this.grid[0])
          this.value.start.y = (Math.round(this.elmY / this.grid[1]) * this.grid[1])
        } else if (this.connecting) {
          this.connectingLinePath = 'M' + this.connectingFrom.cp.x + ',' + this.connectingFrom.cp.y + 'L' + this.elmX + ',' + this.elmY
        } else if (this.reconnecting) {
          this.draggingConnectionPoint.x = this.elmX
          this.draggingConnectionPoint.y = this.elmY
        }
      },
      handleUp: function (e) {
        if (this.resizing) {
          this.resizing = false
          // TODO emits
          this.$emit('resizestop', this.left, this.top, this.width, this.height)
        }
        if (this.dragging) {
          this.dragging = false
          // TODO emits
          this.$emit('dragstop', this.left, this.top)
        }
        if (this.draggingStartPoint) {
          this.draggingStartPoint = false
        }
        if (this.connecting) {
          this.connecting = false
        }
        if (this.reconnecting) {
          this.reconnecting = false
          this.resetActiveConnectionPoints()
        }
      },
      calcArrow: function (cp) {
        // TODO props
        const arrowWidth = 5 // actually half the arrow width
        const arrowHeight = 10

        switch (cp.d) {
          case 'u':
            return 'M' + cp.x + ',' + cp.y + 'l-' + arrowWidth + ',-' + arrowHeight + 'l' + (arrowWidth * 2) + ',0z'
          case 'd':
            return 'M' + cp.x + ',' + cp.y + 'l-' + arrowWidth + ',' + arrowHeight + 'l' + (arrowWidth * 2) + ',0z'
          case 'l':
            return 'M' + cp.x + ',' + cp.y + 'l-' + arrowHeight + ',-' + arrowWidth + 'l0,' + (arrowWidth * 2) + 'z'
          case 'r':
            return 'M' + cp.x + ',' + cp.y + 'l' + arrowHeight + ',-' + arrowWidth + 'l0,' + (arrowWidth * 2) + 'z'
        }
      },
      connectionPoint: function (node, cp) {
        switch (cp) {
          case '__START__':
            return {id: cp, x: node.x, y: node.y + 20, d: 'd'}
          case 0:
            return {id: cp, x: node.x + 20, y: node.y, d: 'u'}
          case 1:
            return {id: cp, x: node.x + this.nodeWidth / 2, y: node.y, d: 'u'}
          case 2:
            return {id: cp, x: node.x + this.nodeWidth - 20, y: node.y, d: 'u'}
          case 3:
            return {id: cp, x: node.x + this.nodeWidth, y: node.y + this.nodeHeight / 2, d: 'r'}
          case 4:
            return {id: cp, x: node.x + this.nodeWidth - 20, y: node.y + this.nodeHeight, d: 'd'}
          case 5:
            return {id: cp, x: node.x + this.nodeWidth / 2, y: node.y + this.nodeHeight, d: 'd'}
          case 6:
            return {id: cp, x: node.x + 20, y: node.y + this.nodeHeight, d: 'd'}
          case 7:
            return {id: cp, x: node.x, y: node.y + this.nodeHeight / 2, d: 'l'}
        }
      },
      calcPathFlow: function (startPoint, endPoint) {
        // TODO prop
        const maxArcSize = 10

        let points = [startPoint]
        Array.prototype.push.apply(points, this.calcPathFlowStep(startPoint, endPoint))

        let line = 'M' + points[0].x + ' ' + points[0].y

        let i
        for (i = 1; i < points.length - 1; i++) {
          let prevPoint = points[i - 1]
          let newPoint = points[i]
          let nextPoint = points[i + 1]
          // calc length of prev and next line segment
          let dPrev = Math.max(this.absolute(prevPoint.x - newPoint.x), this.absolute(prevPoint.y - newPoint.y))
          let dNext = Math.max(this.absolute(nextPoint.x - newPoint.x), this.absolute(nextPoint.y - newPoint.y))

          let offsetY = 0
          let offsetX = 0
          let arcX = 0
          let arcY = 0
          let cw = 0
          // calc the arcSize, based on half the min length of the prev and next segments, but at most 10
          let arcSize = Math.min((Math.floor(Math.min(dPrev, dNext) / 2)), maxArcSize)

          switch (prevPoint.d) {
            case 'u':
              offsetY = arcSize
              arcY = -arcSize
              arcX = newPoint.d === 'l' ? -arcSize : arcSize
              cw = newPoint.d === 'l' ? 0 : 1
              break
            case 'd':
              offsetY = -arcSize
              arcY = arcSize
              arcX = newPoint.d === 'l' ? -arcSize : arcSize
              cw = newPoint.d === 'l' ? 1 : 0
              break
            case 'l':
              offsetX = arcSize
              arcX = -arcSize
              arcY = newPoint.d === 'd' ? arcSize : -arcSize
              cw = newPoint.d === 'd' ? 0 : 1
              break
            case 'r':
              offsetX = -arcSize
              arcX = arcSize
              arcY = newPoint.d === 'd' ? arcSize : -arcSize
              cw = newPoint.d === 'd' ? 1 : 0
              break
          }
          line = line + ' L' + (newPoint.x + offsetX) + ' ' + (newPoint.y + offsetY) + ' a' + arcSize + ',' + arcSize + ' 0 0 ' + cw + ' ' + arcX + ',' + arcY + ' '
        }
        line = line + ' L' + (points[i]).x + ' ' + (points[i]).y
        return line
      },
      calcPathFlowStep: function (startPoint, endPoint) {
        // TODO as prop
        const filler = 30

        let dx = endPoint.x - startPoint.x
        let dy = endPoint.y - startPoint.y

        // 1, check if direct line is possible
        if (this.isDirectLine(startPoint, endPoint)) {
          // console.log('Accept line: ', startPoint, endPoint, dx, dy)
          return [endPoint]
        }

        // create a new point
        let newPoint = {}

        // L profile
        if (this.isLCorner(startPoint, endPoint)) {
          switch (startPoint.d) {
            case 'u':
            case 'd':
              newPoint = {x: startPoint.x, y: startPoint.y + dy, d: dx > 0 ? 'r' : 'l'}
              break
            case 'l':
            case 'r':
              newPoint = {x: startPoint.x + dx, y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
          }
          // console.log('L profile start', startPoint, newPoint, endPoint)
        } else if (startPoint.d === endPoint.d) {
          // U profile

          // we need a possible overshoot, or a filler
          switch (startPoint.d) {
            case 'u':
              newPoint = {x: startPoint.x, y: startPoint.y + Math.min(0, dy) - filler, d: dx > 0 ? 'r' : 'l'}
              break
            case 'd':
              newPoint = {x: startPoint.x, y: startPoint.y + Math.max(0, dy) + filler, d: dx > 0 ? 'r' : 'l'}
              break
            case 'l':
              newPoint = {x: startPoint.x + Math.min(0, dx) - filler, y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
              break
            case 'r':
              newPoint = {x: startPoint.x + Math.max(0, dx) + filler, y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
          }
          // console.log('U profile start', startPoint, newPoint, endPoint)
        } else {
          // fallback, move in direction and try again. Half if direction is ok, filler otherwise
          switch (startPoint.d) {
            case 'u':
              if (dy < 0) {
                newPoint = {x: startPoint.x, y: startPoint.y + Math.round(dy / 2), d: dx > 0 ? 'r' : 'l'}
              } else {
                newPoint = {x: startPoint.x, y: startPoint.y - filler, d: dx > 0 ? 'r' : 'l'}
              }
              break
            case 'd':
              if (dy > 0) {
                newPoint = {x: startPoint.x, y: startPoint.y + Math.round(dy / 2), d: dx > 0 ? 'r' : 'l'}
              } else {
                newPoint = {x: startPoint.x, y: startPoint.y + filler, d: dx > 0 ? 'r' : 'l'}
              }
              break
            case 'l':
              if (dx < 0) {
                newPoint = {x: startPoint.x + Math.round(dx / 2), y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
              } else {
                newPoint = {x: startPoint.x - filler, y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
              }
              break
            case 'r':
              if (dx > 0) {
                newPoint = {x: startPoint.x + Math.round(dx / 2), y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
              } else {
                newPoint = {x: startPoint.x + filler, y: startPoint.y, d: dy > 0 ? 'd' : 'u'}
              }
          }
        }
        let points = [newPoint]
        Array.prototype.push.apply(points, this.calcPathFlowStep(newPoint, endPoint))
        return points
      },
      isLCorner: function (startPoint, endPoint) {
        let dx = endPoint.x - startPoint.x
        let dy = endPoint.y - startPoint.y
        switch (startPoint.d) {
          case 'u':
            return dy < 0 && ((dx > 0 && endPoint.d === 'l') || (dx < 0 && endPoint.d === 'r'))
          case 'd':
            return dy > 0 && ((dx > 0 && endPoint.d === 'l') || (dx < 0 && endPoint.d === 'r'))
          case 'l':
            return dx < 0 && ((dy < 0 && endPoint.d === 'd') || (dy > 0 && endPoint.d === 'u'))
          case 'r':
            return dx > 0 && ((dy < 0 && endPoint.d === 'd') || (dy > 0 && endPoint.d === 'u'))
        }
      },
      isDirectLine: function (startPoint, endPoint) {
        let dx = endPoint.x - startPoint.x
        let dy = endPoint.y - startPoint.y
        let sd = startPoint.d
        let ed = endPoint.d

        if (dx === 0) {
          // | line
          if (dy > 0) {
            // going down
            return sd === 'd' && ed === 'u'
          } else {
            // going up
            return sd === 'u' && ed === 'd'
          }
        }
        if (dy === 0) {
          // - line
          if (dx > 0) {
            // going right
            return sd === 'r' && ed === 'l'
          } else {
            // going left
            return sd === 'l' && ed === 'r'
          }
        }
        return false
      },
      signum: function (x) {
        return (x < 0) ? -1 : 1
      },
      absolute: function (x) {
        return (x < 0) ? -x : x
      },
      getNode: function (id) {
        if (id === '__START__') {
          return this.value.start
        } else {
          return this.value.nodes.find(function (node) {
            return node.id === id
          })
        }
      }
    },
    computed: {
      startConnection: function () {
        // let cpFrom = {id: 0, x: this.value.start.x, y: this.value.start.y + 20, d: 'd'}
        let cpFrom = this.connectionPoint(this.getNode('__START__'), '__START__')
        let cpTo = this.connectionPoint(this.getNode(this.value.start.to), this.value.start.to_cp)
        return {
          connection: this.value.start,
          cpFrom: cpFrom,
          cpTo: cpTo,
          line: this.calcPathFlow(cpFrom, cpTo),
          arrow: this.calcArrow(cpTo)
        }
      },
      connections: function () {
        // console.log('COMPUTING connections')

        // a connection consist of a connection with extra info:
        // { connection: {...},
        //   cpFrom: connection point From
        //   cpTo: connection point To
        //   line: 'Mx yLx y',
        //   arrow: 'Mx yLx y'
        // }
        let vue = this
        return this.value.connections.map(function (connection) {
          let cpFrom = vue.connectionPoint(vue.getNode(connection.from), connection.from_cp)
          let cpTo = vue.connectionPoint(vue.getNode(connection.to), connection.to_cp)
          return {
            connection: connection,
            cpFrom: cpFrom,
            cpTo: cpTo,
            line: vue.calcPathFlow(cpFrom, cpTo),
            arrow: vue.calcArrow(cpTo)
          }
        }).sort(function (a, b) {
          // only a is needed, active is top, hover next, and then the remaining
          if (a.active) return 1
          if (a.hover) return 0
          return -1
        })
      },
      nodes: function () {
        // console.log('COMPUTING nodes')

        // a node consist of:
        // { node: {...},
        //   connectionPoints: [ connection points ... ]
        // }
        let vue = this
        return this.value.nodes.map(function (node) {
          return {
            node: node,
            connectionPoints: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
              return vue.connectionPoint(node, i)
            })
          }
        })
      }

    }
  }
</script>

<style lang="scss" scoped>
  .workflow-editor {
    z-index: -10;
    opacity: 1;
    border: 1px solid darkred;
    background-color: #eeeeee;

    .node {
      cursor: move;
      stroke: none;
      stroke-width: 2;
      fill: dodgerblue;
      .label {
        fill: white;
      }
      &.active {
        .rectangle {
          stroke: darkblue;
          stroke-width: 3;
        }
      }
    }

    .connection {
      fill: none;
      stroke: lightgrey;
      stroke-width: 2;
      .arrow {
        fill: lightgrey;
      }
      &.creating {
        stroke: dodgerblue;
        stroke-dasharray: 5, 5;
      }
      &.hover {
        stroke: darkgrey;
        z-index: 10;
        .arrow {
          fill: darkgrey;
        }
      }
      &.active {
        stroke: darkblue;
        z-index: 5;
        .arrow {
          fill: darkblue;
        }
      }
      .fat {
        stroke-width: 12;
        opacity: 0;
      }
    }

    .connection-point {
      fill: white;
      stroke: dodgerblue;
      stroke-width: 1;
      cursor: crosshair;
      &.connector {
        stroke: black;
        stroke-width: 2;
      }
      .fat {
        stroke-width: 1;
        fill: yellow;
        stroke: yellow;
        opacity: 0;
        &.hover {
          opacity: 0.5;
          fill: dodgerblue;
          stroke: none
        }
      }
    }
  }

</style>
