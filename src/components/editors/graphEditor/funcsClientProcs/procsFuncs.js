import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

const pMan = {
    async ubiiGetResult(topic) {
        await UbiiClientService.instance.waitForConnection()
        const res = await UbiiClientService.instance.client.callService(
            {
                topic: topic
            }
        ) 
        return res
    },

    async addArray(uniq) {
        uniq.forEach(val => {
            val.ids = ['New']
        })
        return uniq
    },
    async addIds(pList, uniq) {
        pList.forEach(val => {
            let p = uniq.filter(u => u.name === val.name)[0]
            p.ids.push(val.id)
        })

        return await uniq
    },
    
    async writeAllProcsToList() {
        
        const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.PM_DATABASE_GET_LIST)
        const pList = await res.processingModuleList.elements
        let uniq = [...new Map(pList.map(item => [item['name'], item])).values()]; //.filter(val => val.sessionId === this.selectedSession.id)
        uniq = await this.addArray(uniq)
        return await this.addIds(pList, uniq)
    }
}

export default { ...pMan }