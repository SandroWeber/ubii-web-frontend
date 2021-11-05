import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiComponent from './ubii-component-base';

const TOPIC_SUFFIX = 'vibration_pattern';

const UBII_SPECS = {
  messageFormat: 'double',
  ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER,
  tags: ['vibration'],
  description: 'web interface component - vibration'
};

export default class UbiiComponentVibration extends UbiiComponent {
  constructor() {
    super(TOPIC_SUFFIX, UBII_SPECS);
  }

  async onStart() {
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
      console.info(this.ubiiSpecs);

      this.tNextVibrate = Date.now();
      navigator.vibrate(100);

      this.subToken = await UbiiClientService.instance.subscribeTopic(this.ubiiSpecs.topic, (pattern) => this.handleVibrationPattern(pattern));

      this.available = true;
    }
  }

  async onStop() {
    this.subToken && await UbiiClientService.instance.unsubscribe(this.subToken);
  }

  /* event callbacks */

  /* topic communication */

  handleVibrationPattern(vibrationPattern) {
    if (Date.now() >= this.tNextVibrate) {
      console.info('handleVibrationPattern');
      console.info(vibrationPattern);
      navigator.vibrate(vibrationPattern);
      this.tNextVibrate = Date.now() + 2 * vibrationPattern;
    }
  }

  /* helper functions */
}
