import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { proto } from '@tum-far/ubii-msg-formats';

import UbiiComponent from '../../../ubii/components/ubii-component-base';

export default class ComponentString extends UbiiComponent {
  static UBII_TEMPLATE = {
    name: 'test-notify-condition.pub-component.string',
    topic: undefined,
    messageFormat: 'string',
    ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
    tags: ['test', 'NotifyCondition', 'string'],
    notifyConditionIds: []
  };

  constructor() {
    super(ComponentString.UBII_TEMPLATE);

    this.counter = 0;
  }

  publish() {
    const data = this.counter.toString();
    const record = {
      topic: this.topic,
      timestamp: UbiiClientService.instance.generateTimestamp(),
      string: data
    };
    UbiiClientService.instance.publishRecordImmediately(record);

    return record;
  }
}
