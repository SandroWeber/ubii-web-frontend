import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

const cMan = {

    async ubiiGetResult(topic) {
        await UbiiClientService.instance.waitForConnection()
        const res = await UbiiClientService.instance.client.callService(
            {
                topic: topic
            }
        ) 
        return res
    },

    async getAllClients() {
        const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.CLIENT_GET_LIST)
        const cList = await res.clientList.elements
        return cList//.filter(val => val.state === 0)
    },
    writeAllClientDevicesToList(clients) {

        let clientDevices = []
        console.warn(clients)
       // clients = clients.filter(val => val.state === 0)
        if(clients === null) return clientDevices

        clients.forEach(c => {
            if(c.devices) {
                c.devices.forEach(dev => {
                    clientDevices.push({
                        id: dev.clientId+'.'+dev.id,
                        name: dev.name,
                        client: true,
                        device: dev,
                        state: c.state 
                    })
                })
            }
           
        })
        return clientDevices
    }
}

export default { ...cMan }