import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default class ModelViewerUbiiConnections {
  constructor(modelViewerRendering) {
    this.modelViewerRendering = modelViewerRendering;
  }

  async init() {
    await UbiiClientService.waitForConnection();

    // find the first best smart device
    this.intervalCheckForSmartphone = setInterval(async () => {
      let response = await UbiiClientService.callService({
        topic: DEFAULT_TOPICS.SERVICES.DEVICE_GET_LIST
      });
      //console.info(response.deviceList);
      for (const device of response.deviceList.elements) {
        if (device.name === 'web-interface-smart-device') {
          clearInterval(this.intervalCheckForSmartphone);
          this.smartDevice = device;
          console.info('smart device found:');
          console.info(this.smartDevice);
          await this.subscribeTopics(this.smartDevice);
        }
      }
    }, 500);
  }

  async subscribeTopics(ubiiDevice) {
    this.componentToucEvents = ubiiDevice.components.find(component =>
      component.topic.includes('/touch_events')
    );
    console.info('componentToucEvents');
    console.info(this.componentToucEvents);
    await UbiiClientService.subscribeTopic(
      this.componentToucEvents.topic,
      touchEvent => {
        //console.info(touchEvent);
      }
    );

    this.componentOrientation = ubiiDevice.components.find(component =>
      component.topic.includes('/orientation')
    );
    console.info('componentOrientation');
    console.info(this.componentOrientation);
    this.subscriptionTokenOrientation = await UbiiClientService.subscribeTopic(
      this.componentOrientation.topic,
      orientation => {
        //console.info(orientation);
        this.modelViewerRendering && this.modelViewerRendering.setSmartphoneRotation(
          orientation.y,
          orientation.x,
          -orientation.z
        );
      }
    );
  }
}
