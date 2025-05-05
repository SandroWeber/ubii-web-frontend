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
    this.failure = true;
    this.status = CONSTANTS.TEST_STATUS.RUNNING;

    this.setup = {};
    this.setup.componentIntegerA = new ComponentInteger();
    if (!(await this.setup.componentIntegerA.register())) return;
    console.info(this.setup.componentIntegerA.ubiiSpecs);
    this.setup.componentIntegerB = new ComponentInteger();
    if (!(await this.setup.componentIntegerB.register())) return;
    console.info(this.setup.componentIntegerB.ubiiSpecs);
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

    this.mapTimestamp2RecordExpected = new Map();
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
    this.setup.componentIntegerA.publish(this.nextIntForA);
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

  onMessageInteger(record) {
    console.info('onMessageInteger()');
    console.info('record:');
    console.info(record);
    this.data.numMsgsReceived[record.topic]++;
    this.data.latestRecordReceived[record.topic] = record;

    const lastRecordA = this.data.latestRecordReceived[this.setup.componentIntegerA.topic];
    console.info('lastRecordA:');
    console.info(lastRecordA);
    const lastRecordB = this.data.latestRecordReceived[this.setup.componentIntegerB.topic];
    console.info('lastRecordB:');
    console.info(lastRecordB);
    if (lastRecordA && lastRecordB) {
      let isExpectedToReceive = Math.abs(lastRecordA.int32 - lastRecordB.int32) < NotifyConditionIntegerDiff.DIFF_THRESHOLD;
      const stringRecord = this.setup.componentString.publish();
      this.mapTimestamp2RecordExpected.set(stringRecord.timestamp, isExpectedToReceive);
      console.info(this.mapTimestamp2RecordExpected.get(stringRecord.timestamp));
      if (!isExpectedToReceive) {
        setTimeout(this.testCondition(stringRecord), 500);
      }
    }
  }

  onMessageString(record) {
    this.data.numMsgsReceived[record.topic]++;
    this.data.latestRecordReceived[record.topic] = record;
    if (!this.testCondition(record)) {
      this.failure = true;
      console.error(
        `received data on "${record.topic}" but the notify condition should not be fulfilled:` +
          `A=${this.data.latestRecordReceived[this.setup.componentIntegerA.topic]}, B=${this.data.latestRecordReceived[this.setup.componentIntegerB.topic]}`
      );
    }
  }

  testCondition(record) {
    const curValueA = this.data.latestRecordReceived[this.setup.componentIntegerA.topic].int32;
    const curValueB = this.data.latestRecordReceived[this.setup.componentIntegerB.topic].int32;
    console.info(`testCondition() - curValueA=${curValueA}, curValueB=${curValueB}`);
    if (typeof curValueA !== 'undefined' && typeof curValueB !== 'undefined') {
      return this.mapTimestamp2RecordExpected.get(record.timestamp);
    }
  }
}
