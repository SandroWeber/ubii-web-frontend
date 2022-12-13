<template>
  <div class="performance-test-rtt">
    <h3>Round-Trip-Time</h3>

    <app-button class="start-button" @click="startTest()" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.test.status !== CONSTANTS.STATUS.RUNNING" />
      <font-awesome-icon icon="spinner" v-show="this.test.status === CONSTANTS.STATUS.RUNNING" />
    </app-button>

    <div class="statistics-grid">
      <span>Status:</span>
      <span class="test-status">{{ this.test.status }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="rtt-message-count"># messages:</label>
      <app-input :id="'rtt-message-count'" :type="'# messages'" v-model="test.config.maxMessages" />
    </div>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import { AppInput, AppButton } from '../../../appComponents/appComponents';
import TestRTT from './testRTT';

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
      this.test.stop();
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
    this.test.stop();
  },
  data: () => {
    return {
      ubiiConnected: false,
      test: new TestRTT(),
      CONSTANTS: TestRTT.CONSTANTS
    };
  },
  methods: {
    startTest: function() {
      this.test.start();
    },
    stopTestRTT: function() {
      this.test.stop();
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
