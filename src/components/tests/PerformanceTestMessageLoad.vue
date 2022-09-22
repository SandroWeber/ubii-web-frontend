<template>
  <div class="performance-test-rtt">
    <h3>Message Load</h3>

    <app-button class="start-button" @click="startTest()" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.testData.status !== TEST_STATUS_RUNNING" />
      <font-awesome-icon icon="spinner" v-show="this.testData.status === TEST_STATUS_RUNNING" />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.testData.status }}</span>

      <span>duration(ms):</span>
      <span class="result-duration" :v-if="this.testData.status === TEST_STATUS_FINISHED">{{
        testData.durationMs
      }}</span>

      <span>reached msgs/s:</span>
      <span class="result-msgs-per-second" :v-if="this.testData.status === TEST_STATUS_FINISHED">{{
        testData.actualMessagesPerSecond
      }}</span>

      <span>avg RTT(ms):</span>
      <span class="result-max-rtt" :v-if="this.testData.status === TEST_STATUS_FINISHED">{{
        this.testData.rttAvg
      }}</span>

      <span>min RTT(ms):</span>
      <span class="result-min-rtt" :v-if="this.testData.status === TEST_STATUS_FINISHED">{{
        this.testData.rttMin
      }}</span>

      <span>max RTT(ms):</span>
      <span class="result-max-rtt" :v-if="this.testData.status === TEST_STATUS_FINISHED">{{
        this.testData.rttMax
      }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="test-duration">duration (s):</label>
      <app-input :id="'test-duration'" :type="'duration'" v-model="targetDurationSeconds" />

      <label for="test-msgs-erp-second">messages / s:</label>
      <app-input :id="'test-msgs-erp-second'" :type="'msgs-per-second'" v-model="targetMessagesPerSecond" />

      <label for="publish-method">publish method:</label>
      <select :id="'publish-method'" v-model="publishMethod">
        <option :value="PUBLISH_METHOD_NORMAL">{{ PUBLISH_METHOD_NORMAL }}</option>
        <option :value="PUBLISH_METHOD_IMMEDIATELY">{{ PUBLISH_METHOD_IMMEDIATELY }}</option>
      </select>
    </div>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import { AppInput, AppButton } from '../appComponents/appComponents';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

const PUBLISH_METHOD_NORMAL = 'normal';
const PUBLISH_METHOD_IMMEDIATELY = 'immediately';
const TEST_STATUS_UNMEASURED = 'unmeasured';
const TEST_STATUS_RUNNING = 'running';
const TEST_STATUS_STOPPED = 'stopped';
const TEST_STATUS_FINISHED = 'finished';

export default {
  name: 'PerformanceTestMessageLoad',
  components: {
    AppInput: AppInput,
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
      TEST_STATUS_FINISHED,
      TEST_STATUS_RUNNING,
      TEST_STATUS_STOPPED,
      TEST_STATUS_UNMEASURED,
      PUBLISH_METHOD_IMMEDIATELY,
      PUBLISH_METHOD_NORMAL,
      targetMessagesPerSecond: '100',
      targetDurationSeconds: '5',
      publishMethod: PUBLISH_METHOD_NORMAL,
      testData: {
        status: TEST_STATUS_UNMEASURED
      }
    };
  },
  methods: {
    prepareTest: function() {
      this.testData = {
        status: TEST_STATUS_RUNNING,
        topic: UbiiClientService.instance.getClientID() + '/test/message_load',
        timings: [],
        numMessagesSent: 0,
        numMessagesReceived: 0
      };
    },
    ubiiSetup: async function() {
      this.onMessageReceived = doubleTimeSent => {
        let tNow = performance.now();
        this.testData.tLastMessageReceived = tNow;
        this.testData.numMessagesReceived++;

        const timing = tNow - doubleTimeSent;
        this.testData.timings.push(timing);
        if (typeof this.testData.rttMin === 'undefined' || this.testData.rttMin > timing) {
          this.testData.rttMin = timing;
        }
        if (typeof this.testData.rttMax === 'undefined' || this.testData.rttMax < timing) {
          this.testData.rttMax = timing;
        }
      };
      await UbiiClientService.instance.subscribeTopic(this.testData.topic, this.onMessageReceived);
    },
    startTest: async function() {
      if (this.testData.status === TEST_STATUS_RUNNING) return;
      this.timeoutStopTest && clearTimeout(this.timeoutStopTest);

      this.prepareTest();
      await this.ubiiSetup();

      this.testData.tTestStart = performance.now();
      let testDurationMs = parseInt(this.targetDurationSeconds) * 1000;
      this.timeoutStopTest = setTimeout(() => this.stopTest(), testDurationMs);

      let messageIntervalMs = 1000 / parseInt(this.targetMessagesPerSecond);
      this.intervalSendMessage = setInterval(() => this.sendMessage(), messageIntervalMs);

      this.testData.status = TEST_STATUS_RUNNING;

      console.info('running test ...'); // eslint-disable-line no-console
    },
    stopTest: async function() {
      this.testData.tTestStop = performance.now();
      this.intervalSendMessage && clearInterval(this.intervalSendMessage);
      await this.deinit();

      this.testData.status = TEST_STATUS_STOPPED;
      this.testData.durationMs = this.testData.tTestStop - this.testData.tTestStart;

      let retriesAwaitingFinished = 0;
      let waitForMessages = () => {
        if (
          this.testData.status === TEST_STATUS_STOPPED &&
          this.testData.numMessagesReceived === this.testData.numMessagesSent
        ) {
          this.finalizeTest();
        } else if (retriesAwaitingFinished < 5) {
          retriesAwaitingFinished++;
          setTimeout(waitForMessages, 500);
        } else {
          console.info(
            'test messages sent / received: ' +
              this.testData.numMessagesSent +
              ' / ' +
              this.testData.numMessagesReceived
          );
          this.finalizeTest();
        }
      };
      waitForMessages();
    },
    finalizeTest: function() {
      this.testData.status = TEST_STATUS_FINISHED;
      this.testData.actualMessagesPerSecond =
        (this.testData.numMessagesReceived / (this.testData.tTestStop - this.testData.tTestStart)) * 1000;
      console.info('... test finished'); // eslint-disable-line no-console
      console.info(this.testData); // eslint-disable-line no-console
      let rttSum = this.testData.timings.reduce((partial_sum, a) => partial_sum + a);
      this.testData.rttAvg = rttSum / this.testData.timings.length;
    },
    deinit: async function() {
      await UbiiClientService.instance.unsubscribeTopic(this.testData.topic, this.onMessageReceived);
    },
    sendMessage: function() {
      let tNow = performance.now();
      this.testData.tLastMessageSent = tNow;
      let record = {
        topic: this.testData.topic,
        double: tNow
      };
      if (this.publishMethod === PUBLISH_METHOD_NORMAL) {
        UbiiClientService.instance.publishRecord(record);
      } else if (this.publishMethod === PUBLISH_METHOD_IMMEDIATELY) {
        UbiiClientService.instance.publishRecordImmediately(record);
      }
      this.testData.numMessagesSent++;
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

.performance-test-rtt {
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
