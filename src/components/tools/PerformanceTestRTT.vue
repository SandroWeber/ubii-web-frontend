<template>
  <div class="performance-test-rtt">
    <h3>Round-Trip-Time</h3>
      
    <app-button class="rtt-start-button" @click="startTestRTT()" :disabled="!ubiiClientService.isConnected">
      <font-awesome-icon icon="play" v-show="this.$data.testRTT.status !== 'running'"/>
      <font-awesome-icon icon="spinner" v-show="this.$data.testRTT.status === 'running'"/>
    </app-button>

    <span class="performance-test-rtt-status">{{this.$data.testRTT.status}}</span>
        
    <div>
      <label for="rtt-message-count"># messages: </label>
      <app-input :id="'rtt-message-count'" :type="'# messages'" v-model="testRTT.messageCount" />
    </div>
  </div>
</template>

<script>
  import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
  
  import { AppInput, AppButton } from '../appComponents/appComponents.js';

  /* fontawesome */
  import {library} from '@fortawesome/fontawesome-svg-core'
  import {faPlay, faSpinner} from '@fortawesome/free-solid-svg-icons'

  library.add(faPlay);
  library.add(faSpinner);

  export default {
    name: 'PerformanceTestRTT',
    components: {
      AppInput: AppInput,
      AppButton: AppButton
    },
    mounted: function () {
      // unsubscribe before page is unloaded
      window.addEventListener('beforeunload', () => {
        this.stopTestRTT();
      });
    },
    beforeDestroy: function () {
      this.stopTestRTT();
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService,
        testRunningRTT: false,
        testRTT: {
          status: 'unmeasured',
          timings: [],
          avgRTT: undefined,
          messageCount: 1000,
          topic: undefined,
          device: {
            name: 'RTT_test_device',
            deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
            components: []
          }
        }
      }
    },
    methods: {
      ubiiSetupRTT: async function() {
        if (!this.$data.testRTT.device.registered) {
          return UbiiClientService.registerDevice(this.$data.testRTT.device)
          .then((device) => {
            this.$data.testRTT.device = device;
            this.$data.testRTT.device.registered = true;
            return device;
          });
        } else {
          return this.$data.testRTT.device;
        }
      },
      prepareTestRTT: function () {
        this.$data.testRTT.status = 'running';
        this.$data.testRTT.topic = UbiiClientService.getClientID() + '/test_rtt';
        this.$data.testRTT.timings = [];
        this.$data.testRTT.tSent = 0;
        this.$data.testRTT.avgRTT = undefined;
      },
      startTestRTT: async function () {
        if (this.$data.testRTT.status === 'running') return;

        this.prepareTestRTT();
        await this.ubiiSetupRTT();

        let counter = 0;

        UbiiClientService.client.subscribe(this.$data.testRTT.topic, () => {
          this.$data.testRTT.timings.push(Date.now() - this.$data.testRTT.tSent);
          counter++;
          if (counter < this.$data.testRTT.messageCount) {
            this.rttSendPackage();
          } else {
            let sum = this.$data.testRTT.timings.reduce((partial_sum, a) => partial_sum + a);
            this.$data.testRTT.avgRTT = sum / this.$data.testRTT.timings.length;
            this.stopTestRTT();
          }
        })
        .then(() => {
          this.rttSendPackage();
        });
      },
      stopTestRTT: function () {
        if (this.$data.testRTT) {
          this.$data.testRTT.status = this.$data.testRTT.avgRTT.toString() + 'ms';
          UbiiClientService.client.unsubscribe(this.$data.testRTT.topic);
        }
      },
      rttSendPackage: function() {
        this.$data.testRTT.tSent = Date.now();
        UbiiClientService.client.publish(
          this.$data.testRTT.device.name,
          this.$data.testRTT.topic,
          'number',
          1
        );
      }
    }
  }
</script>

<style scoped lang="stylus">
    .performance-test-rtt
        display: grid
        grid-gap: 15px
        grid-template-columns: 200px auto

    .rtt-start-button
        width: 50px

    @keyframes spinner {
        to { transform: rotate(360deg); }}
    .fa-spinner
        animation: spinner 1s linear infinite
</style>
