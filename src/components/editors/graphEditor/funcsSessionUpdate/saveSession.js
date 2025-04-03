import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

const sSes = {

    async ubiiGetResult(topic, session) {
        await UbiiClientService.instance.waitForConnection()
        const res = await UbiiClientService.instance.client.callService(
            {
                topic: topic,
                session: session
            }
        ) 
        return res
    },

    async saveSession(session) {
        console.warn(session)
        const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.SESSION_DATABASE_SAVE, session)
        console.warn(res)
        // const cList = await res.clientList.elements
        // return cList//.filter(val => val.state === 0)
    },

}

export default { ...sSes }