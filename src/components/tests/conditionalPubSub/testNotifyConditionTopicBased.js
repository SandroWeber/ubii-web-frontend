import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';

import CONSTANTS from '../constants';

/* eslint-disable no-console */

const NOTIFY_CONDITION_TEMPLATE = {
  name: 'frontend.test-notify-condition',
  evaluationFunctionStringified: undefined
};

const TOPIC_A_RANGE_MIN = -10;
const TOPIC_A_RANGE_MAX = 10;
const DIFF_THRESHOLD = 5;

export default class TestNotifyConditionTopicBased {
  static COMPONENT_TEMPLATE = {
    name: 'frontend.test-notify-condition.pub-component',
    topic: undefined,
    messageFormat: 'int32',
    ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
    tags: ['test', 'NotifyCondition'],
    notifyConditionIds: []
  };

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
    this.setup = {
      topicA: UbiiClientService.instance.getClientID() + '/test/notify-condition/topic-based/entity-a',
      topicB: UbiiClientService.instance.getClientID() + '/test/notify-condition/topic-based/entity-b'
    };
    this.data.recvMsgs[this.setup.topicA] = 0;
    this.data.recvMsgs[this.setup.topicB] = 0;
    this.subTokens = [];

    // notify condition
    let replyNotifyConditionAdd = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.NOTIFY_CONDITION_ADD,
      notifyCondition: this.createNotifyCondition(this.setup.topicA, this.setup.topicB)
    });
    if (replyNotifyConditionAdd.notifyCondition) {
      this.notifyConditionSpecs = replyNotifyConditionAdd.notifyCondition;
    } else {
      console.warn(replyNotifyConditionAdd);
      this.stop();
      return;
    }

    this.setup.entityA = this.createTestEntity(this.setup.topicA, [this.notifyConditionSpecs.id]);
    this.setup.entityB = this.createTestEntity(this.setup.topicB, [this.notifyConditionSpecs.id]);

    let replyDeviceRegistration = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.DEVICE_REGISTRATION,
      device: {
        name: 'test-notify-condition-topic-based',
        clientId: UbiiClientService.instance.getClientID(),
        components: [this.setup.entityA.component, this.setup.entityB.component]
      }
    });
    if (replyDeviceRegistration.device) {
      this.data.device = replyDeviceRegistration.device;
    } else {
      console.error(replyDeviceRegistration);
      this.stop();
      return;
    }

    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(this.setup.topicA, record => this.onMessageReceived(record))
    );
    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(this.setup.topicB, record => this.onMessageReceived(record))
    );
  }

  async start() {
    if (this.status === CONSTANTS.TEST_STATUS.RUNNING) return;

    await this.prepare();

    this.data.tTestStart = performance.now();
    this.status = CONSTANTS.TEST_STATUS.RUNNING;

    this.setup.entityB.publish(0);
    this.nextIntForA = TOPIC_A_RANGE_MIN;
    this.intervalPublishA = setInterval(() => {
      //let randomInt = Math.floor(10 * Math.random());
      this.setup.entityA.publish(this.nextIntForA);
      this.nextIntForA = this.nextIntForA + 1;
      if (this.nextIntForA === TOPIC_A_RANGE_MAX) {
        this.stop();
      }
    }, 100);
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

  createNotifyCondition(topicA, topicB) {
    let condition = Object.assign({}, NOTIFY_CONDITION_TEMPLATE);
    let evaluationCallback = (publisher, subscriber, getTopicDataRecord) => {
      let recordA = getTopicDataRecord({ topic: topicA });
      let recordB = getTopicDataRecord({ topic: topicB });
      let intA = recordA && recordA.int32; // eslint-disable-line no-undef
      let intB = recordB && recordB.int32; // eslint-disable-line no-undef

      if (typeof intA === 'undefined' || typeof intB === 'undefined') return false;
      else return Math.abs(intA - intB) < DIFF_THRESHOLD;
    };
    condition.evaluationFunctionStringified = evaluationCallback.toString();

    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace('topicA', `'${topicA}'`);
    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace('topicB', `'${topicB}'`);
    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace('DIFF_THRESHOLD', `'${DIFF_THRESHOLD}'`);

    return condition;
  }

  createTestEntity(topic, notifyConditionIds) {
    let entity = {
      component: JSON.parse(JSON.stringify(TestNotifyConditionTopicBased.COMPONENT_TEMPLATE))
    };
    entity.component.topic = topic;
    entity.component.notifyConditionIds.push(...notifyConditionIds);
    entity.publish = integer => {
      this.publishInteger(integer, entity.component.topic);
    };

    return entity;
  }

  publishInteger(integer, topic) {
    this.data.curValues[topic] = integer;
    let timestamp = UbiiClientService.instance.generateTimestamp();
    UbiiClientService.instance.publishRecordImmediately({
      topic: topic,
      timestamp: timestamp,
      int32: integer
    });
  }

  onMessageReceived(record) {
    this.data.recvMsgs[record.topic]++;
    if (!this.testCondition()) {
      this.failure = true;
      console.error(
        `received data on "${record.topic}" but the notify condition should not be fulfilled:` +
          `A=${this.data.curValues[this.setup.topicA]}, B=${this.data.curValues[this.setup.topicB]}`
      );
    }
  }

  testCondition() {
    let curValueA = this.data.curValues[this.setup.topicA];
    let curValueB = this.data.curValues[this.setup.topicB];
    console.info(`testCondition() - curValueA=${curValueA}, curValueB=${curValueB}`);
    if (typeof curValueA !== 'undefined' && typeof curValueB !== 'undefined') {
      let valid = Math.abs(curValueA - curValueB) < DIFF_THRESHOLD;
      return valid;
    }
  }
}
