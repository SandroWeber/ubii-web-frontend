<template>
    <div>
        <div id="performance-test-grid">
            <div id="performance-test-rtt-statistics">
                <span>Round-Trip-Time</span>
                <br/>
                <div v-show="ubiiClientService.isConnected && !this.$data.testRTT.running && !this.$data.testRTT.finished">
                    <button class="start-demo-button" v-on:click="startTestRTT()">
                        <font-awesome-icon icon="play"/>
                    </button>
                </div>

                <div v-show="ubiiClientService.isConnected && this.$data.testRTT.running && !this.$data.testRTT.finished">
                    loading animation
                </div>

                <div v-show="ubiiClientService.isConnected && this.$data.testRTT && this.$data.testRTT.finished">
                    {{this.$data.testRTT.avgRTT}}ms
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

  /* fontawesome */
  import {library} from '@fortawesome/fontawesome-svg-core'
  import {faPlay} from '@fortawesome/free-solid-svg-icons'

  library.add(faPlay);

  /* eslint-disable no-console */

  export default {
    name: 'DemoMousePointer',
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
          topic: undefined,
          timings: [],
          avgRTT: undefined,
          messageCount: 1000,
          running: false,
          finished: false,
          device: {
            name: 'RTT_test_device',
            deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
            components: []
          }
        }
      }
    },
    methods: {
      prepareTestRTT: function () {
        this.$data.testRTT.topic = UbiiClientService.getClientID() + '/test_rtt';
        this.$data.testRTT.timings = [];
        this.$data.testRTT.avgRTT = undefined;
        this.$data.testRTT.finished = false;
        this.$data.testRTT.running = true;
      },
      startTestRTT: function () {
        this.prepareTestRTT();

        let counter = 0;
        let tSent = 0;

        let sendNumber = () => {
          tSent = Date.now();
          UbiiClientService.client.publish(
            this.$data.testRTT.device.name,
            this.$data.testRTT.topic,
            'number',
            1
          );
        };


        // register the mouse pointer device
        UbiiClientService.registerDevice(this.$data.testRTT.device)
          .then((device) => {
            // on success, the response will be the (possibly extended) device specification we just sent
            // we accept any additions the server might have made, like an ID that was left blank so the backend
            // would automatically assign one, to our local state
            this.$data.testRTT.device = device;
            return device;
          })
          .then(() => {
            UbiiClientService.client.subscribe(
              this.$data.testRTT.topic,
              // a callback to be called when new data on this topic arrives
              () => {
                this.$data.testRTT.timings.push(Date.now() - tSent);
                counter++;
                if (counter < this.$data.testRTT.messageCount) {
                  sendNumber();
                } else {
                  this.$data.testRTT.finished = true;
                  let sum = this.$data.testRTT.timings.reduce((partial_sum, a) => partial_sum + a);
                  this.$data.testRTT.avgRTT = sum / this.$data.testRTT.timings.length;
                  console.info(this.$data.testRTT.avgRTT + 'ms');
                  this.stopTestRTT();
                }
              })
              .then(() => {
                sendNumber();
              });
          });
      },
      stopTestRTT: function () {
        if (this.$data.testRTT) {
          this.$data.testRTT.running = false;
          this.$data.testRTT.finished = true;
          UbiiClientService.client.unsubscribe(this.$data.testRTT.topic);
        }
      }
    }
  }
</script>

<style scoped lang="stylus">
    .performance-test-grid
        display: grid
        grid-gap: 15px
        grid-template-columns: 1fr 1fr
        height: 100%
</style>
