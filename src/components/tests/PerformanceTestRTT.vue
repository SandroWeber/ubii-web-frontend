<template>
  <div class="performance-test-rtt">
    <h3>Round-Trip-Time</h3>

    <app-button class="start-button" @click="startTestRTT()" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.testRTT.status !== 'running'" />
      <font-awesome-icon icon="spinner" v-show="this.testRTT.status === 'running'" />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.testRTT.status }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="rtt-message-count"># messages:</label>
      <app-input :id="'rtt-message-count'" :type="'# messages'" v-model="testRTT.messageCount" />
    </div>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

import { AppInput, AppButton } from '../appComponents/appComponents';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

export default {
  name: 'PerformanceTestRTT',
  components: {
    AppInput: AppInput,
    AppButton: AppButton
  },
  mounted: async function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopTestRTT();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.ubiiConnected = true;
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.ubiiConnected = false;
    });
    this.ubiiConnected = UbiiClientService.instance.isConnected();
  },
  beforeDestroy: function() {
    this.stopTestRTT();
  },
  data: () => {
    return {
      ubiiConnected: false,
      testRTT: {
        status: 'unmeasured',
        timings: [],
        avgRTT: undefined,
        messageCount: '1000',
        topic: undefined,
        device: {
          name: 'RTT_test_device',
          deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
          components: []
        }
      }
    };
  },
  methods: {
    ubiiSetupRTT: async function() {
      if (!this.testRTT.device.registered) {
        return UbiiClientService.instance.registerDevice(this.testRTT.device).then(device => {
          this.testRTT.device = device;
          this.testRTT.device.registered = true;
          return device;
        });
      } else {
        return this.testRTT.device;
      }
    },
    prepareTestRTT: function() {
      this.testRTT.status = 'running';
      this.testRTT.topic = UbiiClientService.instance.getClientID() + '/test_rtt';
      this.testRTT.timings = [];
      this.testRTT.tSent = 0;
      this.testRTT.avgRTT = undefined;
    },
    startTestRTT: async function() {
      if (this.testRTT.status === 'running') return;

      this.prepareTestRTT();
      await this.ubiiSetupRTT();

      let counter = 0;
      let maxMessages = parseInt(this.testRTT.messageCount);

      UbiiClientService.instance
        .subscribeTopic(this.testRTT.topic, () => {
          const timing = performance.now() - this.testRTT.tSent;
          this.testRTT.timings.push(timing);
          if (typeof this.testRTT.minimum === 'undefined' || this.testRTT.minimum > timing) {
            this.testRTT.minimum = timing;
          }
          if (typeof this.testRTT.maximum === 'undefined' || this.testRTT.maximum < timing) {
            this.testRTT.maximum = timing;
          }
          counter++;
          if (counter < maxMessages) {
            this.rttSendPackage();
          } else {
            let sum = this.testRTT.timings.reduce((partial_sum, a) => partial_sum + a);
            this.testRTT.avgRTT = sum / this.testRTT.timings.length;
            this.stopTestRTT();
          }
        })
        .then(() => {
          this.rttSendPackage();
        });
    },
    stopTestRTT: function() {
      if (this.testRTT && this.testRTT.avgRTT) {
        let statusMsg = 'avg RTT: ' + this.testRTT.avgRTT.toString() + 'ms';
        statusMsg += ' | min: ' + this.testRTT.minimum.toString() + 'ms';
        statusMsg += ', max: ' + this.testRTT.maximum.toString() + 'ms';
        this.testRTT.status = statusMsg;
        UbiiClientService.instance.unsubscribeTopic(this.testRTT.topic);
      }
    },
    rttSendPackage: function() {
      this.testRTT.tSent = performance.now();
      UbiiClientService.instance.publishRecordImmediately({
        topic: this.testRTT.topic,
        double: 1
      });
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
  grid-template-columns: 200px 100px 200px 100px;
  grid-template-rows: 25px;
}
</style>
