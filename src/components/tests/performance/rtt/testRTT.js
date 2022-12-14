import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import CONSTANTS from '../../constants';

export default class TestRTT {
  constructor() {
    this.config = {
      maxMessages: '1000',
      topic: undefined
    };

    this.status = CONSTANTS.TEST_STATUS.UMNEASURED;
  }

  async prepare() {
    this.data = {
      timings: [],
      avgRTT: undefined,
      tSent: undefined
    };
    this.config.topic = UbiiClientService.instance.getClientID() + '/test_rtt';

    let messageCounter = 0;
    let maxMessages = parseInt(this.config.maxMessages);

    this.subToken = await UbiiClientService.instance.subscribeTopic(this.config.topic, () => {
      const timing = performance.now() - this.data.tSent;
      this.data.timings.push(timing);
      if (typeof this.data.minimum === 'undefined' || this.data.minimum > timing) {
        this.data.minimum = timing;
      }
      if (typeof this.data.maximum === 'undefined' || this.data.maximum < timing) {
        this.data.maximum = timing;
      }
      messageCounter++;
      if (messageCounter < maxMessages) {
        this.sendMessage();
      } else {
        this.stop();
      }
    });

    this.sendMessage();
  }

  async start() {
    if (this.status === CONSTANTS.TEST_STATUS.RUNNING) return;
    
    await this.prepare();

    this.status = CONSTANTS.TEST_STATUS.RUNNING;
  }

  stop() {
    this.subToken && UbiiClientService.instance.unsubscribe(this.subToken);

    if (this.data) {
      let sum = this.data.timings.reduce((partial_sum, a) => partial_sum + a);
      this.data.avgRTT = sum / this.data.timings.length;
  
      let statusMsg = 'avg RTT: ' + this.data.avgRTT.toString() + 'ms';
      statusMsg += ' | min: ' + this.data.minimum.toString() + 'ms';
      statusMsg += ', max: ' + this.data.maximum.toString() + 'ms';
      this.status = statusMsg;
    }
  }

  sendMessage() {
    this.data.tSent = performance.now();
    UbiiClientService.instance.publishRecordImmediately({
      topic: this.config.topic,
      double: 1
    });
  }
}
