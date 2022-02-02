<template>
  <div class="performance-test-fibonacci">
    <h3 class="test-title">Fibonacci Processing</h3>

    <app-button
      class="start-button"
      @click="startTest()"
      :disabled="!ubiiConnected"
    >
      <font-awesome-icon
        icon="play"
        v-show="this.testData.status !== 'running'"
      />
      <font-awesome-icon
        icon="spinner"
        v-show="this.testData.status === 'running'"
      />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.testData.status }}</span>
      <!-- time -->
      <span>Test duration (ms):</span>
      <span class="test-status">
        {{ this.testData.statistics.processingTime }}
      </span>
      <!-- number of iterations processed -->
      <span>Number of processed iterations:</span>
      <span class="test-status">{{
        this.testData.statistics.processingIterations
      }}</span>
      <!-- iterations per seconds -->
      <span>Iterations per second:</span>
      <span class="test-status">{{
        this.testData.statistics.processingPerSecond
      }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="fibonacci-session-count" class="setting-label"
        ># sessions:</label
      >
      <app-input
        :id="'fibonacci-session-count'"
        :type="'# sessions'"
        v-model="testData.settings.sessionCount"
      />

      <label for="fibonacci-pm-count" class="setting-label"
        ># processing modules:</label
      >
      <app-input
        :id="'fibonacci-pm-count'"
        :type="'# processing modules'"
        v-model="testData.settings.pmCountPerSession"
      />

      <label for="fibonacci-sequence-length" class="setting-label"
        >sequence length (n):</label
      >
      <app-input
        :id="'fibonacci-sequence-length'"
        :type="'# processing modules'"
        v-model="testData.settings.fibSequenceLength"
      />

      <label for="test-duration" class="setting-label"
        >test duration (s):</label
      >
      <app-input
        :id="'test-duration'"
        :type="'test duration'"
        v-model="testData.settings.testDurationSeconds"
      />

      <label for="fibonacci-node-id" class="setting-label"
        >run on node ID:</label
      >
      <input-node-id :id="'fibonacci-node-id'" v-model="testData.settings.nodeId" />
    </div>
  </div>
</template>

<script>
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

import { AppInput, AppButton } from '../appComponents/appComponents';
import PerformanceTestFibonacciHelper from './performanceTestFibonacciHelper';
import InputNodeId from '../appComponents/InputNodeId.vue';

export default {
  name: 'PerformanceTest-FibonacciProcessing',
  components: {
    AppInput: AppInput,
    AppButton: AppButton,
    InputNodeId
  },
  mounted: async function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopTest();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.ubiiConnected = true;
      this.testData.settings.nodeId = UbiiClientService.instance.client.serverSpecification.id;
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.ubiiConnected = false;
      this.testData.settings.nodeId = undefined;
    });

    await UbiiClientService.instance.waitForConnection();
    this.ubiiConnected = UbiiClientService.instance.isConnected();
    this.testData.settings.nodeId = UbiiClientService.instance.client.serverSpecification.id;
  },
  beforeDestroy: function() {
    this.stopTest();
  },
  data: () => {
    return {
      ubiiConnected: false,
      testRunning: false,
      testData: {
        status: 'unmeasured',
        allSessionsSpecs: [],
        settings: {
          sessionCount: '1',
          pmCountPerSession: '5',
          fibSequenceLength: '9999999',
          testDurationSeconds: '5',
          nodeId: 'unset'
        },
        statistics: {
          processingIterations: 'N/A',
          processingPerSecond: 'N/A',
          processingTime: 'N/A',
          processingFinished: [],
          processingCountMap: new Map()
        }
      }
    };
  },
  methods: {
    prepareTest: function() {
      this.testData.statistics.processingFinished = [];
      this.testData.statistics.processingCountMap.clear();
      this.testData.statistics.processingIterations = 'N/A';
      this.testData.statistics.processingPerSecond = 'N/A';
      this.testData.statistics.processingTime = 'N/A';

      // create all the specs for sessions and processing modules
      this.testData.allSessionsSpecs = PerformanceTestFibonacciHelper.createTestSpecs(
        this.testData.settings.sessionCount,
        this.testData.settings.pmCountPerSession,
        this.testData.settings.nodeId
      );

      this.testData.allSessionsSpecs.forEach(sessionSpec => {
        sessionSpec.ioMappings.forEach(ioMapping => {
          // publish the sequence lengths to be calculated for each processing module
          ioMapping.inputMappings.forEach(inputMapping => {
            if (
              inputMapping.inputName.indexOf(
                PerformanceTestFibonacciHelper.SEQENCE_LENGTH_INPUT_SUFFIX
              ) !== -1
            ) {
              UbiiClientService.instance.publishRecordImmediately({
                topic: inputMapping.topic,
                int32: parseInt(this.testData.settings.fibSequenceLength)
              });
            }
          });

          // subscribe to all processing module output topics
          ioMapping.outputMappings.forEach(outputMapping => {
            if (
              outputMapping.outputName.indexOf(
                PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX
              ) !== -1
            ) {
              let subscriptionTopic = outputMapping.topic;
              UbiiClientService.instance.subscribeTopic(
                subscriptionTopic,
                this.onProcessingFinishedCallback
              );
            }
          });
        });
      });
    },
    startTest: async function() {
      this.prepareTest();

      let sessionSpecs = [];
      this.testData.allSessionsSpecs.forEach(session => {
        UbiiClientService.instance
          .callService({
            topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
            session: session
          })
          .then(reply => {
            if (reply.session) {
              sessionSpecs.push(reply.session);
            } else if (reply.error) {
              // eslint-disable-next-line
              console.error(reply.error);
            }
          });
      });
      this.testData.allSessionsSpecs = sessionSpecs;

      this.testData.status = 'running';
      this.testData.statistics.startTime = Date.now();
      setTimeout(() => {
        this.stopTest();
      }, parseInt(this.testData.settings.testDurationSeconds) * 1000);
    },
    stopTest: async function() {
      this.testData.status = 'done';
      this.testData.statistics.stopTime = Date.now();
      this.testData.allSessionsSpecs.forEach(session => {
        UbiiClientService.instance.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
          session: session
        });
      });

      this.testData.statistics.processingFinished.forEach(id => {
        if (!this.testData.statistics.processingCountMap.has(id)) {
          let count = this.testData.statistics.processingFinished.reduce(
            (n, x) => n + (x === id),
            0
          );
          this.testData.statistics.processingCountMap.set(id, count);
        }
      });

      // unsubscribe from all processing finished topics
      this.testData.allSessionsSpecs.forEach(sessionSpec => {
        sessionSpec.ioMappings.forEach(ioMapping => {
          ioMapping.outputMappings.forEach(outputMapping => {
            if (
              outputMapping.outputName.indexOf(
                PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX
              ) !== -1
            ) {
              let subscriptionTopic = outputMapping.topic;
              UbiiClientService.instance.unsubscribeTopic(
                subscriptionTopic,
                this.onProcessingFinishedCallback
              );
            }
          });
        });
      });

      let passedTime =
        this.testData.statistics.stopTime - this.testData.statistics.startTime;
      this.testData.statistics.processingTime = passedTime;

      let processingIterations = 0;
      this.testData.statistics.processingCountMap.forEach(value => {
        processingIterations += value;
      });
      this.testData.statistics.processingIterations = processingIterations;

      this.testData.statistics.processingPerSecond =
        processingIterations / (passedTime / 1000);
    },
    onProcessingFinishedCallback: function(result, topic) {
      console.info(result);
      if (this.testData.status === 'running') {
        let indexSuffix = topic.indexOf(
          PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX
        );
        let id = topic.substring(0, indexSuffix);
        this.testData.statistics.processingFinished.push(id);
      }
    }
  }
};
</script>

<style scoped>
.performance-test-fibonacci {
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
  grid-template-rows: 25px 25px 25px 25px;
}

.separator {
  grid-area: separator;
  background-color: white;
}

.settings-grid {
  grid-area: settings;
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 200px 200px 200px 200px;
  grid-template-rows: 25px 25px 25px;
}

.test-title {
  grid-area: title;
}

.start-button {
  grid-area: run;
  width: 50px;
}

.setting-label {
  text-align: end;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.fa-spinner {
  animation: spinner 1s linear infinite;
}
</style>
