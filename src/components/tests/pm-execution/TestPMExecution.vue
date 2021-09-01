<template>
  <div class="test-pm-execution-wrapper">
    <h3 class="test-title">PM Execution</h3>

    <app-button class="start-button" @click="startTest()" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.testHelper.statistics.status !== 'running'" />
      <font-awesome-icon icon="spinner" v-show="this.testHelper.statistics.status === 'running'" />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.testHelper.statistics.status }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid">
      <label for="input-node-id" class="setting-label">run on node:</label>

      <b-form-input id="input-node-id" list="input-list-node-ids" v-model="nodeId"></b-form-input>
      <datalist id="input-list-node-ids">
        <option v-for="nodeId in this.nodeIds" :key="nodeId">{{ nodeId }}</option>
      </datalist>
    </div>
  </div>
</template>

<script>
import { BFormInput } from 'bootstrap-vue';

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';
const CLIENT_STATE = proto.ubii.clients.Client.State;
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
    AppButton: AppButton,
    BFormInput,
  },
  data: () => {
    return {
      ubiiConnected: false,
      testHelper: new TestPMExecutionHelper(),
      nodeId: 'unset',
      nodeIds: [],
    };
  },
  mounted: async function () {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopTest();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.onUbiiConnectionChange(true);
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.onUbiiConnectionChange(false);
    });
    await UbiiClientService.instance.waitForConnection();
    this.onUbiiConnectionChange(UbiiClientService.instance.isConnected());
  },
  beforeDestroy: function () {
    this.stopTest();
  },
  methods: {
    onUbiiConnectionChange: function (connected) {
      if (connected === this.ubiiConnected) return;

      this.ubiiConnected = connected;

      if (connected) {
        this.intervalUpdateNodeIds = setInterval(this.updateNodeIDs, 1000);
        this.nodeId = UbiiClientService.instance.client.serverSpecification.id;
      } else {
        this.nodeId = 'unset';
        this.intervalUpdateNodeIds && clearInterval(this.intervalUpdateNodeIds);
      }
    },
    updateNodeIDs: async function () {
      let eligibleNodeIds = [];
      eligibleNodeIds.push(UbiiClientService.instance.client.serverSpecification.id);
      let clientListResponse = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.CLIENT_GET_LIST,
      });
      if (clientListResponse.clientList) {
        eligibleNodeIds.push(
          ...clientListResponse.clientList.elements
            .filter((client) => client.state === CLIENT_STATE.ACTIVE)
            .map((client) => client.id)
        );
      }
      this.nodeIds = eligibleNodeIds;
    },
    startTest: function () {
      this.testHelper.startTest(this.nodeId);
    },
    stopTest: function () {
      this.testHelper.stopTest();
    },
  },
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
  margin: 20px;
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
  grid-template-columns: 150px 1fr;
  grid-template-rows: 25px 50px 25px;
}

.test-title {
  grid-area: title;
  font-size: 1.5em;
  font-weight: bold;
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
