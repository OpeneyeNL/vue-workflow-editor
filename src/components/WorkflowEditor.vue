<template>
  <div class="customWorkflow">
    <h1>Worflow editor</h1>
    <div>
      <button @click="addNode">Add Node</button>
    </div>
    <div v-if="editNode">
      Id: {{ editNode.id }}<br/>
      Name: <input type="text" v-model="editNode.label"/><br/>
      X: {{ editNode.x }}, Y: {{ editNode.y }}
    </div>
    <vue-workflow-editor :width="600" :height="500"
                         :grid="[25,25]"
                         :parent="true"
                         v-model="workflow"
                         @activatedNode="doEditNode"/>

  </div>
</template>

<script>
  export default {
    name: 'workflow-editor',
    data () {
      return {
        editNode: null,
        workflow: {
          start: {
            from: '__START__',
            from_cp: '__START__',
            id: '__START__',
            label: 'Start',
            x: 150,
            y: 50,
            to: 'id1',
            to_cp: 2
          },
          nodes: [
            {
              id: 'id1',
              x: 100,
              y: 100,
              label: 'Status 100'
            }, {
              id: 'id2',
              x: 400,
              y: 100,
              label: 'Status 2'
            }, {
              id: 'id3',
              x: 100,
              y: 300,
              label: 'Status 3'
            }
          ],
          connections: [
            {
              id: 't_id1',
              from: 'id1',
              from_cp: 3,
              to: 'id2',
              to_cp: 7,
              label: 'from 1 to 2'
            }, {
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
    },
    mounted:
      function () {
        console.log('Workflow editor mounted!')
      },
    beforeRouteLeave (to, from, next) {
      next()
    },
    methods: {
      addNode: function () {
        // TODO id as uuid
        console.log('Adding node')
        this.workflow.nodes.push({id: Math.floor(Math.random() * 10000), 'label': 'New node', x: 0, y: 0})
      },
      doEditNode: function (node) {
        this.editNode = node
      }
    }
  }
  /**

   //helper functions, it turned out chrome doesn't support Math.sgn()
   function signum(x) {
    return (x < 0) ? -1 : 1;
  }
   function absolute(x) {
    return (x < 0) ? -x : x;
  }

   function drawPath(svg, path, startX, startY, endX, endY) {
    // get the path's stroke width (if one wanted to be  really precize, one could use half the stroke size)
    var stroke =  parseFloat(path.css("stroke-width"));
    // check if the svg is big enough to draw the path, if not, set heigh/width
    if (svg.attr("height") <  endY)                 svg.attr("height", endY);
    if (svg.attr("width" ) < (startX + stroke) )    svg.attr("width", (startX + stroke));
    if (svg.attr("width" ) < (endX   + stroke) )    svg.attr("width", (endX   + stroke));

    var deltaX = (endX - startX) * 0.15;
    var deltaY = (endY - startY) * 0.15;
    // for further calculations which ever is the shortest distance
    var delta  =  deltaY < absolute(deltaX) ? deltaY : absolute(deltaX);

    // set sweep-flag (counter/clock-wise)
    // if start element is closer to the left edge,
    // draw the first arc counter-clockwise, and the second one clock-wise
    var arc1 = 0; var arc2 = 1;
    if (startX > endX) {
      arc1 = 1;
      arc2 = 0;
    }
    // draw tha pipe-like path
    // 1. move a bit down, 2. arch,  3. move a bit to the right, 4.arch, 5. move down to the end
    path.attr("d",  "M"  + startX + " " + startY +
      " V" + (startY + delta) +
      " A" + delta + " " +  delta + " 0 0 " + arc1 + " " + (startX + delta*signum(deltaX)) + " " + (startY + 2*delta) +
      " H" + (endX - delta*signum(deltaX)) +
      " A" + delta + " " +  delta + " 0 0 " + arc2 + " " + endX + " " + (startY + 3*delta) +
      " V" + endY );
  }

   function connectElements(svg, path, startElem, endElem) {
    var svgContainer= $("#svgContainer");

    // if first element is lower than the second, swap!
    if(startElem.offset().top > endElem.offset().top){
      var temp = startElem;
      startElem = endElem;
      endElem = temp;
    }

    // get (top, left) corner coordinates of the svg container
    var svgTop  = svgContainer.offset().top;
    var svgLeft = svgContainer.offset().left;

    // get (top, left) coordinates for the two elements
    var startCoord = startElem.offset();
    var endCoord   = endElem.offset();

    // calculate path's start (x,y)  coords
    // we want the x coordinate to visually result in the element's mid point
    var startX = startCoord.left + 0.5*startElem.outerWidth() - svgLeft;    // x = left offset + 0.5*width - svg's left offset
    var startY = startCoord.top  + startElem.outerHeight() - svgTop;        // y = top offset + height - svg's top offset

    // calculate path's end (x,y) coords
    var endX = endCoord.left + 0.5*endElem.outerWidth() - svgLeft;
    var endY = endCoord.top  - svgTop;

    // call function for drawing the path
    drawPath(svg, path, startX, startY, endX, endY);
  }
   function resetSVGsize(){
    $("#svg1").attr("height", "0");
    $("#svg1").attr("width", "0");
  }

   function connectAll() {
    // connect all the paths you want!
    connectElements($("#svg1"), $("#path1"), $("#teal"),   $("#orange"));
    connectElements($("#svg1"), $("#path2"), $("#red"),    $("#orange"));
    connectElements($("#svg1"), $("#path3"), $("#teal"),   $("#aqua")  );
    connectElements($("#svg1"), $("#path4"), $("#red"),    $("#aqua")  );
    connectElements($("#svg1"), $("#path5"), $("#purple"), $("#teal")  );
    connectElements($("#svg1"), $("#path6"), $("#orange"), $("#green") );
  }

   var i = -15;
   function quick_demo(){
    i += 0.2;
    var outerW  = parseInt($("#outer").css('width'));
    $("#outer").css({'width': outerW+i});
    resetSVGsize();
    connectAll();

    if (i<14.7) requestAnimationFrame(quick_demo);
    else        $("#outer").css({'width': ''});
  }

   $(document).ready(function() {
    // reset svg each time
    resetSVGsize();
    connectAll();
    // resize simulation demo, comment it out to make it stop
    quick_demo();

  });

   $(window).resize(function () {
    // reset svg each time
    resetSVGsize();
    connectAll();
  });
   */
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  .customWorkflow {
    /deep/ .svgNodeRect {
      fill: red;
    }
  }

  h3 {
    clear: left;
  }
</style>
