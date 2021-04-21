import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default class ModelViewerUbiiConnections {
  async init() {
    await UbiiClientService.waitForConnection();

    this.intervalCheckForSmartphone = setInterval(async () => {
        let responseDeviceList = await UbiiClientService.callService({
            topic: DEFAULT_TOPICS.SERVICES.DEVICE_GET_LIST
        });
        console.info(responseDeviceList);
        /*for(const device of responseDeviceList.elements) {
            if (device.name === 'web-interface-smart-device') {
                this.smartDevice = device;
                //clearInterval(this.intervalCheckForSmartphone);
            }
        }*/
        // master-node: get rid of devices of disconnected clients
    }, 500);
  }
}