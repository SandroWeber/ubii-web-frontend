<template>
  <div class="test-wrapper">
    <h3>NotifyCondition (topic dependency)</h3>

    <app-button class="start-button" @click="startTest" :disabled="!ubiiConnected">
      <font-awesome-icon icon="play" v-show="this.test.status !== TEST_STATUS.RUNNING" />
      <font-awesome-icon icon="spinner" v-show="this.test.status === TEST_STATUS.RUNNING" />
    </app-button>

    <div class="statistics-grid">
      <!-- status -->
      <span>Status:</span>
      <span class="test-status">{{ this.test.status }}</span>
    </div>

    <div class="separator"></div>

    <div class="settings-grid"></div>
  </div>
</template>

<script>

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import { AppButton } from '../../appComponents/appComponents';
import CONSTANTS from '../constants';
import TestNotifyConditionTopicBased from './testNotifyConditionTopicBased';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faSpinner);

export default {
  name: 'TestNotifyConditionTopicBased',
  components: {
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
      TEST_STATUS: CONSTANTS.TEST_STATUS,
      test: new TestNotifyConditionTopicBased()
    };
  },
  methods: {
    startTest: async function() {
      this.test.start();
    },
    stopTest: async function() {
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
