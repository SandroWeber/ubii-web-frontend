<template>
  <div class="performance-test-fibonacci">
    <h3 class="test-title">Fibonacci Processing</h3>

    <app-button
      class="start-button"
      @click="startTest()"
      :disabled="!ubiiClientService.isConnected"
    >
      <font-awesome-icon icon="play" v-show="this.testData.status !== 'running'" />
      <font-awesome-icon icon="spinner" v-show="this.testData.status === 'running'" />
    </app-button>

    <div class="statistics-grid">
      <span>Status:</span>
      <span class="test-status">{{ this.testData.status }}</span>
      <span>Number of processed iterations:</span>
      <span class="test-status">
        {{
        this.testData.numProcessingIterations
        }}
      </span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="fibonacci-session-count" class="setting-label"># sessions:</label>
      <app-input
        :id="'fibonacci-session-count'"
        :type="'# sessions'"
        v-model="testData.sessionCount"
      />

      <label for="fibonacci-interaction-count" class="setting-label"># interactions:</label>
      <app-input
        :id="'fibonacci-interaction-count'"
        :type="'# interactions'"
        v-model="testData.interactionCountPerSession"
      />

      <label for="fibonacci-sequence-length" class="setting-label">fib sequence length (n):</label>
      <app-input
        :id="'fibonacci-sequence-length'"
        :type="'# interactions'"
        v-model="testData.fibSequenceLength"
      />

      <label for="test-duration" class="setting-label">test duration (seconds):</label>
      <app-input :id="'test-duration'" :type="'test duration'" v-model="testData.testDuration" />
    </div>
  </div>
</template>

<script>
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import { AppInput, AppButton } from '../appComponents/appComponents.js';
import PerformanceTestFibonacciHelper from './tests/performanceTestFibonacciHelper';

export default {
  name: 'PerformanceTest-FibonacciProcessing',
  components: {
    AppInput: AppInput,
    AppButton: AppButton
  },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopTest();
    });
  },
  beforeDestroy: function() {
    this.stopTest();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      testRunning: false,
      testData: {
        sessionCount: '1',
        interactionCountPerSession: '5',
        fibSequenceLength: '20',
        testDuration: '5',
        status: 'unmeasured',
        numProcessingIterations: 'N/A',
        allSessionsSpecs: []
        /*device: {
          name: 'fibonacci-performance-test-device',
          deviceType:
            ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
          components: [
            {
              topic:
                '/' + UbiiClientService.getClientID + '/perf-test/fibonacci',
              messageFormat: 'string',
              ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
            }
          ]
        }*/
      }
    };
  },
  methods: {
    ubiiSetup: async function() {
      /*if (!this.testData.device.registered) {
        return UbiiClientService.registerDevice(this.testRTT.device).then(
          device => {
            this.testData.device = device;
            this.testData.device.registered = true;
            return device;
          }
        );
      } else {
        return this.testData.device;
      }*/
    },
    prepareTest: function() {
      this.testData.processingCountMap = new Map();
      this.testData.processingFinished = [];

      // create all the specs for sessions and interactions
      this.testData.allSessionsSpecs = PerformanceTestFibonacciHelper.createTestSpecs(
        this.testData.sessionCount,
        this.testData.interactionCountPerSession
      );

      this.testData.allSessionsSpecs.forEach(sessionSpec => {
        sessionSpec.ioMappings.forEach(ioMapping => {
          // publish the sequence lengths to be calculated for each interaction
          ioMapping.inputMappings.forEach(inputMapping => {
            if (
              inputMapping.name.indexOf(
                PerformanceTestFibonacciHelper.SEQENCE_LENGTH_INPUT_SUFFIX
              ) !== -1
            ) {
              UbiiClientService.publishRecord({
                topic:
                  '/' +
                  ioMapping.interactionId +
                  '/' +
                  PerformanceTestFibonacciHelper.SEQENCE_LENGTH_INPUT_SUFFIX,
                double: parseFloat(this.testData.fibSequenceLength)
              });
            }
          });

          // subscribe to all interaction output topics
          ioMapping.outputMappings.forEach(outputMapping => {
            if (
              outputMapping.name.indexOf(
                PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX
              ) !== -1
            ) {
              let subscriptionTopic =
                '/' +
                ioMapping.interactionId +
                '/' +
                PerformanceTestFibonacciHelper.PROCESSED_OUTPUT_SUFFIX;
              UbiiClientService.subscribe(
                subscriptionTopic,
                this.onProcessingFinishedCallback
              );
            }
          });
        });
      });
    },
    startTest: async function() {
      //await UbiiClientService.deregisterDevice(this.testData.device);
      /*await UbiiClientService.unsubscribe(
        this.testData.device.components[0].topic
      );*/
      this.testData.numProcessingIterations = 'N/A';

      this.prepareTest();
      console.info(this.testData.processingFinished);

      this.testData.allSessionsSpecs.forEach(session => {
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
          session: session
        });
      });

      this.testData.status = 'running';
      this.testData.startTime = Date.now();
      setTimeout(() => {
        this.stopTest();
      }, parseInt(this.testData.testDuration) * 1000);
    },
    stopTest: async function() {
      this.testData.status = 'done';
      this.testData.stopTime = Date.now();
      this.testData.allSessionsSpecs.forEach(session => {
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: session
        });
      });

      this.testData.processingFinished.forEach(id => {
        if (!this.testData.processingCountMap.has(id)) {
          let count = this.testData.processingFinished.reduce(
            (n, x) => n + (x === id),
            0
          );
          this.testData.processingCountMap.set(id, count);
        }
      });

      let passedTime = this.testData.stopTime - this.testData.startTime;
      console.info('passed time (ms): ' + passedTime);
      let numProcessingIterations = 0;
      this.testData.processingCountMap.forEach(value => {
        numProcessingIterations += value;
      });
      console.info('numProcessingIterations: ' + numProcessingIterations);
      this.testData.numProcessingIterations = numProcessingIterations;
    },
    onProcessingFinishedCallback: function(float, topic) {
      if (this.testData.status === 'running') {
        /*let count = this.testData.processingCountMap.get(id);
        this.testData.processingCountMap.set(id, count++);
        console.info(id + ' ' + count);*/
        let id = topic.substring(1, 37); // uuidv4 is 36 chars long
        this.testData.processingFinished.push(id);
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
  grid-template-rows: 20px 25px 25px;
  grid-template-areas:
    'run title title title'
    'empty statistics separator settings'
    'empty statistics separator settings';
}

.statistics-grid {
  grid-area: statistics;
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 20px;
}

.separator {
  grid-area: separator;
  background-color: white;
}

.settings-grid {
  grid-area: settings;
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 200px 50px 200px 50px;
  grid-template-rows: 20px 20px;
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
