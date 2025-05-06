import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import CONSTANTS from '../constants';
import ComponentInteger from './componentInteger';
import NotifyConditionIntegerDiff from './notifyConditionIntegerDiff';
import ComponentString from './componentString';

/* eslint-disable no-console */

const TOPIC_A_RANGE_MIN = -10;
const TOPIC_A_RANGE_MAX = 10;

export default class TestNotifyConditionTopicBased {
  get currentIntA() {
    return this.data.latestRecordReceived[this.setup.componentIntegerA.topic].int32;
  }

  get currentIntB() {
    return this.data.latestRecordReceived[this.setup.componentIntegerB.topic].int32;
  }

  get currentString() {
    return this.data.latestRecordReceived[this.setup.componentString.topic].string;
  }

  constructor() {
    this.status = CONSTANTS.TEST_STATUS.UMNEASURED;
    this.result = 'undetermined';
    this.data = {
      recvMsgs: {},
      curValues: {}
    };
  }

  async prepare() {
    this.result = 'undetermined';
    this.failure = false;
    this.status = CONSTANTS.TEST_STATUS.RUNNING;

    this.setup = {};
    this.setup.componentIntegerA = new ComponentInteger();
    if (!(await this.setup.componentIntegerA.register())) return;
    this.setup.componentIntegerB = new ComponentInteger();
    if (!(await this.setup.componentIntegerB.register())) return;
    this.setup.notifyCondition = new NotifyConditionIntegerDiff(
      this.setup.componentIntegerA.topic,
      this.setup.componentIntegerB.topic
    );
    if (!(await this.setup.notifyCondition.register())) return;
    this.setup.componentString = new ComponentString();
    this.setup.componentString.updateUbiiSpecs({ notifyConditionIds: [this.setup.notifyCondition.id] });
    if (!(await this.setup.componentString.register())) return;

    this.subTokens = [];
    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(this.setup.componentIntegerA.topic, record =>
        this.onMessageInteger(record)
      )
    );
    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(this.setup.componentIntegerB.topic, record =>
        this.onMessageInteger(record)
      )
    );
    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(this.setup.componentString.topic, record =>
        this.onMessageString(record)
      )
    );

    this.mapTimestamp2StringExpected = new Map();
    this.data = {
      latestRecordReceived: {},
      numMsgsReceived: {}
    };
    this.data.numMsgsReceived[this.setup.componentIntegerA.topic] = 0;
    this.data.numMsgsReceived[this.setup.componentIntegerB.topic] = 0;
    this.data.numMsgsReceived[this.setup.componentString.topic] = 0;
  }

  async start() {
    if (this.status === CONSTANTS.TEST_STATUS.RUNNING) return;

    await this.prepare();

    this.data.tTestStart = performance.now();
    this.status = CONSTANTS.TEST_STATUS.RUNNING;

    this.setup.componentIntegerB.publish(0);
    this.nextIntForA = TOPIC_A_RANGE_MIN;
    this.publishNextIntA();
  }

  async stop() {
    this.data.tTestStop = performance.now();
    this.intervalPublishA && clearInterval(this.intervalPublishA);

    if (this.subTokens && UbiiClientService.instance.isConnected()) {
      for (let token of this.subTokens) {
        await UbiiClientService.instance.unsubscribe(token);
      }
    }

    this.status = CONSTANTS.TEST_STATUS.STOPPED;
    this.data.durationMs = this.data.tTestStop - this.data.tTestStart;
    if (this.failure) {
      this.result = 'failed';
    } else {
      this.result = 'success';
    }
  }

  async createComponentIntegerCondition(notifyConditionIds) {
    let protoSpecs = JSON.parse(JSON.stringify(TestNotifyConditionTopicBased.COMPONENT_TEMPLATE));
    protoSpecs.notifyConditionIds.push(...notifyConditionIds);
    let component = new UbiiComponent(protoSpecs);

    const success = await component.register();
    if (!success) return undefined;

    let reply = (component.publish = integer => {
      this.publishInteger(integer, component.protoSpecs.topic);
    });

    return component;
  }

  publishNextIntA() {
    this.setup.componentIntegerA.publish(this.nextIntForA);
    this.nextIntForA++;
  }

  onMessageInteger(record) {
    this.data.numMsgsReceived[record.topic]++;
    this.data.latestRecordReceived[record.topic] = record;

    const lastRecordA = this.data.latestRecordReceived[this.setup.componentIntegerA.topic];
    const lastRecordB = this.data.latestRecordReceived[this.setup.componentIntegerB.topic];
    if (lastRecordA && lastRecordB) {
      let isExpectedToReceive =
        Math.abs(lastRecordA.int32 - lastRecordB.int32) < NotifyConditionIntegerDiff.DIFF_THRESHOLD;
      const stringRecord = this.setup.componentString.publish();
      this.mapTimestamp2StringExpected.set(stringRecord.timestamp.millis, isExpectedToReceive);
      if (!isExpectedToReceive) {
        this.timeoutWaitForStringMsg = setTimeout(this.testCallback(stringRecord, false), 300);
      }
    }
  }

  onMessageString(record) {
    clearTimeout(this.timeoutWaitForStringMsg);
    this.data.numMsgsReceived[record.topic]++;
    this.data.latestRecordReceived[record.topic] = record;
    this.testCallback(record, true);
  }

  testCallback(record, shouldReceive) {
    if (shouldReceive !== this.mapTimestamp2StringExpected.get(record.timestamp.millis)) {
      this.failure = true;
      console.error(
        `did not receive data on "${record.topic}" when notify condition should be fulfilled, ran into timeout:` +
          `A=${this.data.latestRecordReceived[this.setup.componentIntegerA.topic]}, B=${
            this.data.latestRecordReceived[this.setup.componentIntegerB.topic]
          }`
      );
    } else {
      if (this.nextIntForA === TOPIC_A_RANGE_MAX) {
        clearTimeout(this.timeoutWaitForStringMsg);
        this.stop();
      } else {
        this.publishNextIntA();
      }
    }
  }
}
