<template>
  <div class="test-pm-execution-wrapper">
    <h3 class="test-title">PM Execution</h3>

    <app-button class="start-button" @click="startTest()" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.testData.status !== 'running'" />
      <font-awesome-icon icon="spinner" v-show="this.testData.status === 'running'" />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.testData.status }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="node-id" class="setting-label">run on node:</label>
      <app-input :id="'node-id'" :type="'node id'" v-model="nodeId" />
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

import { AppInput, AppButton } from '../../appComponents/appComponents';
import TestPMExecutionHelper from './testPMExecutionHelper';

export default {
  name: 'Test-PM-Execution',
  components: {
    AppInput: AppInput,
    AppButton: AppButton
  },
  data: () => {
    return {
      ubiiConnected: false,
      testHelper: new TestPMExecutionHelper(),
      nodeId: undefined
    };
  },
  mounted: async function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopTest();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.ubiiConnected = true;
      this.nodeId = UbiiClientService.instance.client.serverSpecification.id;
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.ubiiConnected = false;
      this.nodeId = undefined;
    });
    await UbiiClientService.instance.waitForConnection();
    this.ubiiConnected = UbiiClientService.instance.isConnected();
    this.nodeId = UbiiClientService.instance.client.serverSpecification.id;
  },
  beforeDestroy: function() {
    this.stopTest();
  },
  methods: {
    startTest: function() {
      this.test = new TestPMExecutionHelper();
      this.test.startTest(this.nodeId);
    }
  }
};
</script>

<style scoped>
.test-pm-execution-wrapper {
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
  grid-template-columns: 200px 100px 200px 100px;
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
