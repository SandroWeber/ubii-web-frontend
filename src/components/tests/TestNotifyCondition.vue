<template>
  <div class="test-wrapper">
    <h3>NotifyCondition (topic dependency)</h3>

    <app-button class="start-button" @click="startTest()" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.testData.status !== TEST_STATUS_RUNNING" />
      <font-awesome-icon icon="spinner" v-show="this.testData.status === TEST_STATUS_RUNNING" />
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
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';

import { AppButton } from '../appComponents/appComponents';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

const TEST_STATUS_UNMEASURED = 'unmeasured';
const TEST_STATUS_RUNNING = 'running';
const TEST_STATUS_STOPPED = 'stopped';
const TEST_STATUS_FINISHED = 'finished';

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

const DEVICE_TEMPLATE = {
  name: 'frontend.test-notify-condition.device',
  tags: ['test', 'NotifyCondition'],
  components: []
};

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

    this.testData.status = TEST_STATUS_UNMEASURED;
  },
  beforeDestroy: function() {
    this.deinit();
  },
  data: () => {
    return {
      ubiiConnected: false,
      TEST_STATUS_RUNNING,
      TEST_STATUS_UNMEASURED,
      TEST_STATUS_STOPPED,
      TEST_STATUS_FINISHED,
      testData: {
        status: TEST_STATUS_UNMEASURED
      }
    };
  },
  methods: {
    prepareTest: async function() {
      this.testData = {
        status: TEST_STATUS_RUNNING,
        topic: UbiiClientService.instance.getClientID() + '/test/message_load'
      };

      // publishing entities with components
      let topicA = UbiiClientService.instance.getClientID() + '/test-notify-condition/entity-a';
      let topicB = UbiiClientService.instance.getClientID() + '/test-notify-condition/entity-b';

      // notify condition
      let reply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.NOTIFY_CONDITION_ADD,
        notifyCondition: this.createNotifyCondition(topicA, topicB)
      });
      console.info(reply);
      if (reply.notifyCondition) {
        this.notifyConditionSpecs = reply.notifyCondition;
      } else {
        console.warn(reply);
      }

      this.entityA = this.createTestEntity(topicA, [this.notifyConditionSpecs.id]);
      this.entityB = this.createTestEntity(topicB, [this.notifyConditionSpecs.id]);
    },
    startTest: async function() {
      if (this.testData.status === TEST_STATUS_RUNNING) return;

      await this.prepareTest();

      this.testData.tTestStart = performance.now();
      this.testData.status = TEST_STATUS_RUNNING;

      console.info('running test ...'); // eslint-disable-line no-console
    },
    stopTest: async function() {
      this.testData.tTestStop = performance.now();
      await this.deinit();

      this.testData.status = TEST_STATUS_STOPPED;
      this.testData.durationMs = this.testData.tTestStop - this.testData.tTestStart;
    },
    deinit: async function() {
      await UbiiClientService.instance.unsubscribeTopic(this.testData.topic, this.onMessageReceived);
    },
    createNotifyCondition: function(topicA, topicB) {
      let condition = Object.assign({}, NOTIFY_CONDITION_TEMPLATE);
      let evaluate = () => {
        let intA = getTopicDataRecord({ topic: topicA }); // eslint-disable-line no-undef
        let intB = getTopicDataRecord({ topic: topicB }); // eslint-disable-line no-undef

        return Math.abs(intA - intB) < 5;
      };
      condition.evaluationFunctionStringified = evaluate.toString();

      return condition;
    },
    createTestEntity: function(topic, notifyConditionIds) {
      let entity = {
        component: Object.assign({}, COMPONENT_TEMPLATE)
      };
      entity.component.topic = topic;
      entity.component.notifyConditionIds.push(...notifyConditionIds);

      return entity;
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
