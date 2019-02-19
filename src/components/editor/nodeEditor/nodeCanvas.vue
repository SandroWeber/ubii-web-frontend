<template>
  <div class="node-canvas layer-three background shadow">
      <div id="rete">
      </div>
      <div class="blueprint-grid">
        <svg width="100%" height="100%">
            <defs>
                <pattern id="dots" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                    <circle class="blueprint-dot" cx="10.5" cy="10.5" r="1.5" />
                </pattern>
            </defs>

            <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
        </svg>
    </div> 
  </div>
</template>

<script>
  import Rete from "rete";
  import ConnectionPlugin from 'rete-connection-plugin';
  import VueRenderPlugin from 'rete-vue-render-plugin';

  import NumComponent from "./nodeComponents/numComponent.js";
  import AddComponent from "./nodeComponents/addComponent.js";


  

  export default { 
    name: 'nodeCanvas',
    data: () => {
        return {
          ConnectionPlugin: ConnectionPlugin,
          VueRenderPlugin: VueRenderPlugin
        };
      },
    components: {},
    mounted() {
            //(async () => {

    var container = document.querySelector('#rete');
    var components = [new NumComponent(), new AddComponent()];

    var editor = new Rete.NodeEditor('demo@0.1.0', container);
    editor.use(this.ConnectionPlugin.default);
    //editor.use(this.VueRenderPlugin.default);
    
        
    //let readyMenu = [10, 12, 14];
    //let dontHide = ['click'];
    //editor.use(ContextMenuPlugin.default);
    //editor.use(AreaPlugin);
    //editor.use(CommentPlugin);
    //editor.use(HistoryPlugin);

    var engine = new Rete.Engine('demo@0.1.0');
    
    components.map(c => {
        editor.register(c);
        engine.register(c);
    });

    /*var n1 = await components[0].createNode({num: 2});
    var n2 = await components[0].createNode({num: 0});
    var add = await components[1].createNode();

    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];


    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);

    editor.connect(n1.outputs.get('num'), add.inputs.get('num1'));
    editor.connect(n2.outputs.get('num'), add.inputs.get('num2'));*/


    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
      //console.log('process');
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    //AreaPlugin.zoomAt(editor);
    editor.trigger('process');
  //})();
    }
  } 
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus"> 
  .node-canvas { 
    width: 100%; 
    height: 100%;  
  } 
  .blueprint-grid {
    width: 100%;
    height: 100%;
  }
  .blueprint-dot {
    fill: lowContrastColor
  }
  #rete{
    width 100%
    height 1000px
  }
</style>
