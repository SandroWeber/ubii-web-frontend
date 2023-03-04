import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';

import CONSTANTS from '../constants';

/* eslint-disable no-console */

const NOTIFY_CONDITION_TEMPLATE = {
  name: 'frontend.test-notify-condition',
  evaluationFunctionStringified: undefined
};

const COMPONENT_TEMPLATE = {
  name: 'frontend.test-notify-condition.pub-component',
  topic: undefined,
  messageFormat: 'int32',
  ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
  tags: ['test', 'NotifyCondition'],
  notifyConditionIds: []
};

export default class TestNotifyConditionTopicBased {
  constructor() {
    this.status = CONSTANTS.TEST_STATUS.UMNEASURED;
    this.result = 'undetermined';
    this.data = {
      recvMsgs: {},
      curValues: {}
    };
  }

  async prepare() {
    console.info('preparing test');

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
      console.info('NotifyCondition registered:');
      console.info(this.notifyConditionSpecs);
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
      console.info('device registered:');
      console.info(this.data.device);
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
    console.info('starting test');
    if (this.status === CONSTANTS.TEST_STATUS.RUNNING) return;

    await this.prepare();

    this.data.tTestStart = performance.now();
    this.status = CONSTANTS.TEST_STATUS.RUNNING;

    console.info('running test ...');
    this.setup.entityB.publish(1);
    this.nextIntForA = -10;
    this.intervalPublishA = setInterval(() => {
      //let randomInt = Math.floor(10 * Math.random());
      this.setup.entityA.publish(this.nextIntForA);
      this.nextIntForA = this.nextIntForA + 1;
      if (this.nextIntForA === 10) {
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
      else return Math.abs(intA - intB) < 5;
    };
    condition.evaluationFunctionStringified = evaluationCallback.toString();

    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace('topicA', `'${topicA}'`);
    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace('topicB', `'${topicB}'`);

    return condition;
  }

  createTestEntity(topic, notifyConditionIds) {
    let entity = {
      component: Object.assign({}, COMPONENT_TEMPLATE)
    };
    entity.component.topic = topic;
    entity.component.notifyConditionIds.push(...notifyConditionIds);
    entity.publish = integer => {
      this.publishInteger(integer, entity.component.topic);
    };

    return entity;
  }

  publishInteger(integer, topic) {
    console.info('publishInteger() - ' + integer + ' on ' + topic);
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
    if (typeof curValueA !== 'undefined' && typeof curValueB !== 'undefined') {
      let boolean = Math.abs(curValueA - curValueB) < 5;
      console.info('testCondition() - ' + boolean);
      return Math.abs(curValueA - curValueB) < 5;
    }
  }
}
