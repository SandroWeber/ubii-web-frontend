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
    }

} 

export default { ...cPos }