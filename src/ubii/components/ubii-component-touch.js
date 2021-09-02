import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiComponent from './ubii-component-base';

const TOPIC_SUFFIX = 'touch_events';

const UBII_SPECS = {
  messageFormat: 'ubii.dataStructure.TouchEventList',
  ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
  tags: ['touch'],
  description: 'web interface - touch screen'
};

export default class UbiiComponentTouchscreen extends UbiiComponent {
  constructor(publishFrequencyMS, touchElement) {
    super(TOPIC_SUFFIX);
    Object.assign(this, UBII_SPECS);

    this.publishFrequencyMS = publishFrequencyMS;
    this.touchElement = touchElement;
  }

  onStart() {
    this.continuousPublishing();
  }

  /* event callbacks */

  onTouchStart(event) {
    this.touches = event.touches;

    let touchList = [];
    for (let i = 0; i < event.touches.length; i++) {
      touchList.push({
        id: event.touches[i].identifier.toString(),
        type: ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType.TOUCH_START,
        position: this.normalizeCoordinates(event.touches[i])
      });
    }
    //console.info(touchList);
    this.publishTouchEventList(touchList);
  }

  onTouchMove(event) {
    this.touches = event.touches;
    this.newTouchMoveEvent = true;
  }

  onTouchEnd(event) {
    this.touches = event.touches;

    let touchList = [];
    for (let i = 0; i < event.touches.length; i++) {
      touchList.push({
        id: event.touches[i].identifier.toString(),
        type: ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType.TOUCH_END,
        position: this.normalizeCoordinates(event.touches[i])
      });
    }
    //console.info(touchList);
    this.publishTouchEventList(touchList);
  }

  /* topic communication */

  async continuousPublishing() {
    if (this.newTouchMoveEvent) {
      let touchList = [];
      for (let i = 0; i < this.touches.length; i++) {
        touchList.push({
          id: this.touches[i].identifier.toString(),
          type: ProtobufLibrary.ubii.dataStructure.TouchEvent.TouchEventType.TOUCH_MOVE,
          position: this.normalizeCoordinates(this.touches[i])
        });
      }
      this.publishTouchEventList(touchList);
      this.newTouchMoveEvent = false;
    }

    if (this.running) {
      setTimeout(() => {
        this.continuousPublishing();
      }, this.publishFrequencyMS);
    }
  }

  publishTouchEventList(touches) {
    UbiiClientService.instance.publish({
      topicDataRecord: {
        topic: this.topic,
        touchEventList: { elements: touches }
      }
    });
  }

  /* helper functions */

  normalizeCoordinates(touchEvent) {
    let normalizedX = (touchEvent.clientX - this.touchElement.offsetLeft) / this.touchElement.offsetWidth;
    let normalizedY = (touchEvent.clientY - this.touchElement.offsetTop) / this.touchElement.offsetHeight;

    return { x: normalizedX, y: normalizedY };
  }
}
