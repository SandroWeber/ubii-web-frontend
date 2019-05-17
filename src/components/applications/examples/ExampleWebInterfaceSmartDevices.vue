<template>
    <div>
        <div v-show="!ubiiClientService.isConnected">
            <span class="notification">Please connect to backend before starting the application.</span>
        </div>

        <div id="example-web-smart-devices-touch-positions" class="touch-position-area"
             v-show="ubiiClientService.isConnected">
        </div>
    </div>
</template>

<script>
  import {DEFAULT_TOPICS} from '@tum-far/ubii-msg-formats';
  import UbiiClientService from '../../../services/ubiiClient/ubiiClientService';

  /* eslint-disable no-console */

  export default {
    name: 'ExampleGathererWebInterfaceSmartDevices',
    mounted: function () {
      // unsubscribe before page is unloaded
      window.addEventListener('beforeunload', () => {
        this.stopExample();
      });

      this.startExample();
    },
    beforeDestroy: function () {
      this.stopExample();
    },
    data: () => {
      return {
        ubiiClientService: UbiiClientService,
        clients: new Map(),
        pollSmartDevices: false
      }
    },
    methods: {
      startExample: function () {
        this.$data.pollSmartDevices = true;
        UbiiClientService.isConnected().then(() => {
          this.updateSmartDevices();
        });
      },
      stopExample: function () {
        this.$data.pollSmartDevices = false;
      },
      updateSmartDevices: function () {
        UbiiClientService.client.callService({topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST})
          .then((reply) => {
            this.$data.topicList = reply.stringList.list;

            this.$data.topicList.forEach((topic) => {
              let smart_device_touch_topic_index = topic.indexOf('/web-interface-smart-device/touch_position');
              if (smart_device_touch_topic_index !== -1) {
                let clientID = topic.substring(0, smart_device_touch_topic_index);

                if (!this.$data.clients.has(clientID)) {
                  this.addClient(clientID, topic);
                }
              }
            })
          });

        if (this.$data.pollSmartDevices) {
          setTimeout(this.updateSmartDevices, 1000);
        }
      },
      getRandomColor: function () {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
      addClient: function(clientID, topic) {
        let touchPosElement = document.createElement('div');
        touchPosElement.style.width = '10px';
        touchPosElement.style.height = '10px';
        touchPosElement.style.position = 'relative';
        touchPosElement.style.backgroundColor = this.getRandomColor();
        document.getElementById('example-web-smart-devices-touch-positions').appendChild(touchPosElement);

        // create client object with necessary info
        let client = {
          topicTouchPosition: topic,
          touchPosition: {x: undefined, y: undefined},
          color: touchPosElement.style.backgroundColor,
          touchPosIndicator: touchPosElement
        };
        this.$data.clients.set(clientID, client);

        UbiiClientService.client.subscribe(
          client.topicTouchPosition,
          (touchPosition) => {
            let boundingRect = document.getElementById('example-web-smart-devices-touch-positions').getBoundingClientRect();

            client.touchPosition.x = Math.floor(touchPosition.x * boundingRect.width);
            client.touchPosition.y = Math.floor(touchPosition.y * boundingRect.height);

            client.touchPosIndicator.style.left = client.touchPosition.x.toString() + 'px';
            client.touchPosIndicator.style.top = client.touchPosition.y.toString() + 'px';
          });
      }
    }
  }
</script>

<style scoped lang="stylus">
    .touch-position-area
        margin: 5px
        border: 3px solid white
        height: 100% - 10px;

    .touch-position-indicator
        width: 2px;
        height: 2px;
</style>
