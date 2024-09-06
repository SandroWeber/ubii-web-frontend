import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import CONSTANTS from '../../constants';

const TIMEOUT_CHECK_FAILED = 5000;

export default class TestRTT {
  constructor() {
    this.config = {
      maxMessages: '1000',
      topic: undefined
    };

    this.status = CONSTANTS.TEST_STATUS.UMNEASURED;
  }

  async prepare() {
    if (!this.config.topic) {
      this.config.topic = UbiiClientService.instance.getClientID() + '/test_rtt';
    }

    this.data = {
      timings: [],
      avgRTT: undefined,
      tSent: undefined
    };

    let messageCounter = 0;
    let maxMessages = parseInt(this.config.maxMessages);

    this.subToken = await UbiiClientService.instance.subscribeTopic(this.config.topic, () => {
      const timing = performance.now() - this.data.tSent;

      if (!isNaN(timing)) {
        this.data.timings.push(timing);
        if (typeof this.data.minimum === 'undefined' || this.data.minimum > timing) {
          this.data.minimum = timing;
        }
        if (typeof this.data.maximum === 'undefined' || this.data.maximum < timing) {
          this.data.maximum = timing;
        }
      }

      messageCounter++;
      if (messageCounter < maxMessages) {
        this.sendMessage();
      } else {
        this.stop();
      }
    });

    this.timeoutCheckFailure = setTimeout(() => {
      if (messageCounter === 0) {
        console.error('test seems to have failed, no messages received since start!');
        this.stop();
        this.status = CONSTANTS.TEST_STATUS.FAILED;
      }
    }, TIMEOUT_CHECK_FAILED);
  }

  async start() {
    if (this.status === CONSTANTS.TEST_STATUS.RUNNING) return;

    await this.prepare();
    this.sendMessage();

    this.status = CONSTANTS.TEST_STATUS.RUNNING;
  }

  async stop() {
    this.subToken && (await UbiiClientService.instance.unsubscribe(this.subToken));

    if (this.data && this.data.timings && this.data.timings.length > 0) {
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
