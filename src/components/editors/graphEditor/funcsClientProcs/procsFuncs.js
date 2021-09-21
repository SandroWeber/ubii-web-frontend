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
        console.warn(res)
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
            if (p != null)
                p.ids.push(JSON.stringify({'Proc ID': val.id, 'Status': val.status}))
        })

        return await uniq
    },
    
    async writeAllProcsToList(session) {
        
        const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.PM_DATABASE_GET_LIST)
        const pList = await res.processingModuleList.elements
        let uniq = null
        if(session !== null ) { uniq = [...new Map(pList.filter(val => val.sessionId === session.id).map(item => [item['name'], item])).values()]; }
        else { uniq = [...new Map(pList.map(item => [item['name'], item])).values()]; }
        uniq = await this.addArray(uniq)
        console.warn('HELLO')
        console.warn(uniq)
        return await this.addIds(pList, uniq)
    }
}

export default { ...pMan }