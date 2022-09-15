import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

const TouchEventType = ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType;

const TAG_COMPONENT_TOUCH = 'touch';
const TAG_COMPONENT_ORIENTATION = 'orientation';


export default class ModelViewerUbiiConnections {
  constructor(modelViewerRendering) {
    this.modelViewerRendering = modelViewerRendering;
  }

  async init() {
    await UbiiClientService.instance.waitForConnection();

    // find the first best smart device
    this.intervalCheckForSmartphone = setInterval(async () => {
      let response = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.DEVICE_GET_LIST,
        deviceList: {
          elements: [
            {
              components: [
                {
                  tags: [TAG_COMPONENT_TOUCH]
                },
                {
                  tags: [TAG_COMPONENT_ORIENTATION]
                }
              ]
            }
          ]
        }
      });
      if (response && response.deviceList && response.deviceList.elements) {
        for (const device of response.deviceList.elements) {
          if (device.tags.includes('smart device')) {
            clearInterval(this.intervalCheckForSmartphone);
            this.smartDevice = device;
            await this.subscribeTopics(this.smartDevice);
          }
        }
      }
    }, 500);
  }

  async subscribeTopics(ubiiDevice) {
    this.componentTouchEvents = ubiiDevice.components.find(component => component.tags && component.tags.includes(TAG_COMPONENT_TOUCH));
    await UbiiClientService.instance.subscribeTopic(this.componentTouchEvents.topic, touchEventList => {
      this.onTouchEvents(touchEventList);
    });

    this.componentOrientation = ubiiDevice.components.find(component => component.tags.includes(TAG_COMPONENT_ORIENTATION));
    this.subscriptionTokenOrientation = await UbiiClientService.instance.subscribeTopic(
      this.componentOrientation.topic,
      orientation => {
        this.modelViewerRendering &&
          this.modelViewerRendering.setSmartphoneRotation(orientation.y, orientation.x, -orientation.z);
      }
    );
  }

  onTouchEvents(touchEventList) {
    let touches = touchEventList.elements;

    if (touches.length === 1 && touches[0].type === TouchEventType.TOUCH_START) {
      this.singleFingerDown = true;
    } else if (touches.length >= 2 && touches[0].type === TouchEventType.TOUCH_START) {
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
