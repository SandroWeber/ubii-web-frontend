import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { proto } from '@tum-far/ubii-msg-formats';

import UbiiComponent from '../../../ubii/components/ubii-component-base';

export default class ComponentInteger extends UbiiComponent {
  static UBII_TEMPLATE = {
    name: 'test-notify-condition.pub-component.int',
    topic: undefined,
    messageFormat: 'int32',
    ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
    tags: ['test', 'NotifyCondition', 'int32'],
    notifyConditionIds: []
  };

  static getRandomInt() {
    return Math.floor(Math.random() * 20) - 10;
  }

  constructor() {
    super(ComponentInteger.UBII_TEMPLATE);
  }

  async onStart() {
    this.subTokens = [];
    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(this.topic, record => this.onMessageReceived(record))
    );
  }

  async onStop() {
    for (let token of this.subTokens) {
      await UbiiClientService.instance.unsubscribe(token);
    }
  }

  publish(integer) {
    if (!integer) integer = ComponentInteger.getRandomInt();
    let timestamp = UbiiClientService.instance.generateTimestamp();
    UbiiClientService.instance.publishRecordImmediately({
      topic: this.topic,
      timestamp: timestamp,
      int32: integer
    });
  }
}
