import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

const ButtonEventType = ProtobufLibrary.ubii.dataStructure.ButtonEventType;

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
    this.componentTouchEvents = ubiiDevice.components.find(component =>
      component.topic.includes('/touch_events')
    );
    console.info('componentTouchEvents');
    console.info(this.componentTouchEvents);
    await UbiiClientService.subscribeTopic(
      this.componentTouchEvents.topic,
      touchEventList => {
        this.onTouchEvents(touchEventList);
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

  onTouchEvents(touchEventList) {
    let touches = touchEventList.elements;
    //console.info(touches);

    if (touches.length === 1 && touches[0].type === ButtonEventType.DOWN) {
      this.singleFingerDown = true;
    } else if (touches.length >= 2 && touches[0].type === ButtonEventType.DOWN) {
      this.singleFingerDown = false;

      this.modelViewerRendering.startSelectionRotation();
    }

    if (touches.length === 0 && this.singleFingerDown) {
      this.singleFingerDown = false;
      this.modelViewerRendering.triggerSelection();
    }
    
    if (touches.length < 2) {
      this.modelViewerRendering.stopSelectionRotation();
    }
  }
}
