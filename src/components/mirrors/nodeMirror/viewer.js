import ContextMenuPlugin from 'rete-context-menu-plugin';

import { initialize as init } from './rete.js'
//import data from '@/rete/data/ecosystem.json';

import NumComponent from "./nodeComponents/numComponent.js";
import AddComponent from "./nodeComponents/addComponent.js";

export default async function(container) {
    const {
        editor,
        engine,
        resize,
        process
    } = await init(container);
    
    editor.use(ContextMenuPlugin);
    
    var components = [new NumComponent(), new AddComponent()];

    components.map(c => {
        editor.register(c);
        engine.register(c);
    });
    
    // Laod from JSON
    //await editor.fromJSON(data);

    var n1 = await components[0].createNode({num: 2});
    var n2 = await components[0].createNode({num: 0});
    var add = await components[1].createNode();

    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];

    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);

    editor.connect(n1.outputs.get('num'), add.inputs.get('num1'));
    editor.connect(n2.outputs.get('num'), add.inputs.get('num2'));

    window.editor = editor;
    
    resize();
    process();
}