<template>
  <div class="test-wrapper">
    <h3>NotifyCondition (topic dependency)</h3>

    <app-button class="start-button" @click="startTest" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.testData.status !== TEST_STATUS.RUNNING" />
      <font-awesome-icon icon="spinner" v-show="this.testData.status === TEST_STATUS.RUNNING" />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.testData.status }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid"></div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';

import { AppButton } from '../../appComponents/appComponents';
import CONSTANTS from '../constants';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

/*const TEST_STATUS_UNMEASURED = 'unmeasured';
const TEST_STATUS_RUNNING = 'running';
const TEST_STATUS_STOPPED = 'stopped';
const TEST_STATUS_FINISHED = 'finished';*/

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

/*const DEVICE_TEMPLATE = {
  name: 'frontend.test-notify-condition.device',
  tags: ['test', 'NotifyCondition'],
  components: []
};*/

export default {
  name: 'TestNotifyCondition',
  components: {
    AppButton: AppButton
  },
  mounted: async function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.deinit();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.ubiiConnected = true;
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.ubiiConnected = false;
    });
    this.ubiiConnected = UbiiClientService.instance.isConnected();

    this.testData.status = CONSTANTS.TEST_STATUS.UNMEASURED;
  },
  beforeDestroy: function() {
    this.deinit();
  },
  data: () => {
    return {
      ubiiConnected: false,
      /*TEST_STATUS_RUNNING,
      TEST_STATUS_UNMEASURED,
      TEST_STATUS_STOPPED,
      TEST_STATUS_FINISHED,*/
      TEST_STATUS: CONSTANTS.TEST_STATUS,
      testData: {
        status: CONSTANTS.TEST_STATUS.UNMEASURED
      }
    };
  },
  methods: {
    prepareTest: async function() {
      console.info('preparing test');
      this.testData = {
        status: CONSTANTS.TEST_STATUS.RUNNING,
        topicA: UbiiClientService.instance.getClientID() + '/test/notify-condition/topic-based/entity-a',
        topicB: UbiiClientService.instance.getClientID() + '/test/notify-condition/topic-based/entity-b',
        recvMsgs: {},
        curValues: {}
      };
      this.testData.recvMsgs[this.testData.topicA] = 0;
      this.testData.recvMsgs[this.testData.topicB] = 0;
      this.subTokens = [];

      // notify condition
      let replyNotifyConditionAdd = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.NOTIFY_CONDITION_ADD,
        notifyCondition: this.createNotifyCondition(this.testData.topicA, this.testData.topicB)
      });
      if (replyNotifyConditionAdd.notifyCondition) {
        this.notifyConditionSpecs = replyNotifyConditionAdd.notifyCondition;
        console.info('NotifyCondition registered:');
        console.info(this.notifyConditionSpecs);
      } else {
        console.warn(replyNotifyConditionAdd);
        this.deinit();
        return;
      }

      this.testData.entityA = this.createTestEntity(this.testData.topicA, [this.notifyConditionSpecs.id]);
      this.testData.entityB = this.createTestEntity(this.testData.topicB, [this.notifyConditionSpecs.id]);

      let replyDeviceRegistration = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.DEVICE_REGISTRATION,
        device: {
          name: 'test-notify-condition-topic-based',
          clientId: UbiiClientService.instance.getClientID(),
          components: [this.testData.entityA.component, this.testData.entityB.component]
        }
      });
      if (replyDeviceRegistration.device) {
        this.testData.device = replyDeviceRegistration.device;
        console.info('device registered:');
        console.info(this.testData.device);
      } else {
        console.error(replyDeviceRegistration);
        this.deinit();
        return;
      }

      this.subTokens.push(
        await UbiiClientService.instance.subscribeTopic(this.testData.topicA, record => this.onMessageReceived(record))
      );
      this.subTokens.push(
        await UbiiClientService.instance.subscribeTopic(this.testData.topicB, record => this.onMessageReceived(record))
      );
    },
    startTest: async function() {
      console.info('starting test');
      if (this.testData.status === CONSTANTS.TEST_STATUS.RUNNING) return;

      await this.prepareTest();

      this.testData.tTestStart = performance.now();
      this.testData.status = CONSTANTS.TEST_STATUS.RUNNING;

      console.info('running test ...'); // eslint-disable-line no-console
      this.testData.entityB.publish(1);
      this.intervalPublishA = setInterval(() => {
        let randomInt = Math.floor(10 * Math.random());
        this.testData.entityA.publish(randomInt);
      }, 3000);
    },
    stopTest: async function() {
      this.testData.tTestStop = performance.now();
      await this.deinit();

      this.testData.status = CONSTANTS.TEST_STATUS.STOPPED;
      this.testData.durationMs = this.testData.tTestStop - this.testData.tTestStart;
    },
    deinit: async function() {
      if (this.subTokens && UbiiClientService.instance.isConnected()) {
        for (let token of this.subTokens) {
          await UbiiClientService.instance.unsubscribe(token);
        }
      }
    },
    createNotifyCondition: function(topicA, topicB) {
      let condition = Object.assign({}, NOTIFY_CONDITION_TEMPLATE);
      let evaluationCallback = (publisher, subscriber, getTopicDataRecord) => {
        let recordA = getTopicDataRecord({ topic: topicA });
        let recordB = getTopicDataRecord({ topic: topicB });
        let intA = recordA && recordA.int32; // eslint-disable-line no-undef
        let intB = recordB && recordB.int32; // eslint-disable-line no-undef
        //console.info('evaluating for A=' + intA + ', B=' + intB);

        if (typeof intA === 'undefined' || typeof intB === 'undefined') return false;
        else return Math.abs(intA - intB) < 5;
      };
      condition.evaluationFunctionStringified = evaluationCallback.toString();
      //console.info(condition.evaluationFunctionStringified.indexOf('topicA'));
      //console.info(condition.evaluationFunctionStringified.indexOf('topicB'));

      condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace(
        'topicA',
        `'${topicA}'`
      );
      condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replace(
        'topicB',
        `'${topicB}'`
      );
      //console.info(condition.evaluationFunctionStringified);

      return condition;
    },
    createTestEntity: function(topic, notifyConditionIds) {
      let entity = {
        component: Object.assign({}, COMPONENT_TEMPLATE)
      };
      entity.component.topic = topic;
      entity.component.notifyConditionIds.push(...notifyConditionIds);
      entity.publish = integer => {
        this.publish(integer, entity.component.topic);
      };

      return entity;
    },
    testCondition: function() {
      let curValueA = this.testData.curValues[this.testData.topicA];
      let curValueB = this.testData.curValues[this.testData.topicB];
      if (curValueA && curValueB) {
        return Math.abs(curValueA - curValueB) < 5;
      }
    },
    publish: function(integer, topic) {
      console.info('publish() - ' + integer + ' on ' + topic);
      this.testData.curValues[topic] = integer;
      let timestamp = UbiiClientService.instance.generateTimestamp();
      UbiiClientService.instance.publishRecordImmediately({
        topic: topic,
        timestamp: timestamp,
        int32: integer
      });
    },
    onMessageReceived: function(record) {
      this.testData.recvMsgs[record.topic]++;
      if (!this.testCondition()) {
        console.error(
          `received data on "${record.topic}" but the notify condition should not be fulfilled:` +
            `A=${this.testData.curValues[this.testData.topicA]}, B=${this.testData.curValues[this.testData.topicB]}`
        );
      }
    }
  }
};
</script>

<style scoped>
.start-button {
  grid-area: run;
  width: 50px;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.fa-spinner {
  animation: spinner 1s linear infinite;
}

.test-wrapper {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 50px 1fr 3px 1fr;
  grid-template-rows: 20px 1fr;
  grid-template-areas:
    'run title title title'
    'empty statistics separator settings';
}

.statistics-grid {
  grid-area: statistics;
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 25px;
}

.separator {
  grid-area: separator;
  background-color: white;
}

.settings-grid {
  grid-area: settings;
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 200px 150px;
  grid-template-rows: 25px;
}
</style>
