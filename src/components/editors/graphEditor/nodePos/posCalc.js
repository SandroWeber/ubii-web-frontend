import {forceSimulation, forceLink, forceCollide, forceCenter} from 'd3-force'

const cPos = {

    ubii: [],

    loadStorage () {
        if (localStorage.getItem('ubii')) {
            try {
                this.ubii = JSON.parse(localStorage.getItem('ubii'));
            } catch(e) {
                localStorage.removeItem('ubii');
            }
        }
    },
    removeObjFromArray(obj){

        let nodeIndex = -1
        this.ubii.forEach((val,index) => {
          if(val.name === obj.name) nodeIndex = index;
        })
  
        if (nodeIndex >= 0) {
            this.ubii.splice(nodeIndex, 1);
        }

    },
    saveSession(obj) {
        // ensure they actually typed something
        if (!obj) {
            return;
        }

        this.loadStorage()
        if(this.ubii.some(val => val.sesssionName === obj.sesssionName))
        {
            this.removeObjFromArray(obj)
        } 

        this.ubii.push(obj);
        this.saveSessionToLocal();
    },
    saveSessionToLocal() {
        const parsed = JSON.stringify(this.ubii);
        console.warn(parsed);
        localStorage.setItem('ubii', parsed);
    },
    loadSessionFromLocal(name) {
        this.loadStorage()
        return this.ubii.filter(val => val.sessionName === name)[0]
    },
    force(llinks) {
        const o_nodes = Object.values(llinks).map(val => {return val.origin_id})
        const t_nodes = Object.values(llinks).map(val => {return val.target_id})
        const nodes = Array.from(new Set(o_nodes.concat(t_nodes))).map(val => {return {'id': val, 'radius': 200}})
        const links = Object.values(llinks).map(val => {return {source:val.origin_id,target:val.target_id}})
        return forceSimulation(nodes)
        .force("link", forceLink(links).id(d => d.id))
        .force("collide", forceCollide().radius(d => d.radius + 1).iterations(3))
        .force("center", forceCenter(640 / 2, 480 / 2))
    }

} 

export default { ...cPos }