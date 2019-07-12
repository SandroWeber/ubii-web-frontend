<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="example-web-smart-devices-touch-positions" class="touch-position-area"></div>
  </UbiiClientContent>
</template>

<script>
import uuidv4 from 'uuid/v4';

import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

import UbiiClientContent from '../sharedModules/UbiiClientContent';
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService';
import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

/* eslint-disable no-console */

export default {
  name: 'ExampleGathererWebInterfaceSmartDevices',
  components: { UbiiClientContent },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, this.startExample);
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stopExample);

    this.createUbiiSpecs();
    UbiiClientService.isConnected().then(() => {
      this.startExample();
    });
  },
  beforeDestroy: function() {
    this.stopExample();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      clients: new Map()
    };
  },
  methods: {
    startExample: function() {
      this.pollSmartDevices = true;
      UbiiClientService.isConnected().then(() => {
        this.updateSmartDevices();

        /* we register our device needed to publish the vibration distance threshold */
        UbiiClientService.registerDevice(this.device)
          .then(response => {
            console.info('startExample: ');
            console.info(response);
            if (response.id) {
              this.device = response;
              return response;
            } else {
              console.info(response);
            }
          })
          .then(() => {
            /* we publish the vibration distance threshold */
            UbiiClientService.client.publish(
              this.device.name,
              this.topicVibrationDistanceThreshold,
              'double',
              0.03
            );

            /* we start the session with the specs created in createUbiiSpecs() */
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.session
              })
              .then(response => {
                if (response.id) {
                  console.info(response);
                  this.session = response;
                }
              });
          });
      });
    },
    stopExample: function() {
      this.pollSmartDevices = false;

      if (this.session) {
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: this.session
        });
      }
    },
    createUbiiSpecs: function() {
      /* this is the processing callback that compares touch positions and lets devices vibrate whose positions are close */
      let processCB = (inputs, outputs) => {
        /* compare touch positions of all smart devices, let those who are close (distance below threshold) vibrate */
        let positionRecords = inputs.muxTouchPositions;
        let vibrationIndices = [];
        let threshold = inputs.vibrationDistanceThreshold;
        positionRecords.forEach((current, currentIndex) => {
          // compare to the remaining other positions
          let closeIndices = [];
          for (
            let compareIndex = currentIndex + 1;
            compareIndex < positionRecords.length;
            compareIndex++
          ) {
            let pos1 = current.data;
            let pos2 = positionRecords[compareIndex].data;
            if (pos1 && pos2) {
              let distance = Math.sqrt(
                Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
              );
              if (distance < threshold) {
                closeIndices.push(compareIndex);
              }
            }
          }

          if (closeIndices.length > 0) {
            vibrationIndices.push(currentIndex, ...closeIndices);
          }
        });
        // get rid of all duplicates
        vibrationIndices = vibrationIndices.filter((current, currentIndex) => {
          return (
            vibrationIndices.findIndex(element => {
              return element === current;
            }) === currentIndex
          );
        });

        /* write demux output list */
        /**
         * Check the "muxerTouchPositions" specifications below. The identityMatchPattern extracts the client UUID and
         * provides it as "positionRecords[index].identity". We use this UUID as our outputTopicParams for the demuxer,
         * i.e. it will fill in when constructing the output topic.
         * Take a look at the "demuxerVibrations" specifications below. The outputTopicParams (i.e. the client UUID) provided here
         * will fill in for the outputTopicFormat's "%s" placeholder.
         * */
        let vibrationDemuxOutput = vibrationIndices.map(index => {
          return {
            outputTopicParams: [positionRecords[index].identity],
            data: 100 // 100ms duration
          };
        });
        outputs.demuxVibration = vibrationDemuxOutput;
      };

      /* our interaction with the I/O specifications fitting the processCB */
      this.interaction = {
        id: uuidv4(),
        name: 'SmartDeviceGathererExample - Interaction',
        processingCallback: processCB.toString(),
        inputFormats: [
          {
            internalName: 'muxTouchPositions',
            messageFormat: 'vector2'
          },
          {
            internalName: 'vibrationDistanceThreshold',
            messageFormat: 'double'
          }
        ],
        outputFormats: [
          {
            internalName: 'demuxVibration',
            messageFormat: 'double'
          }
        ]
      };

      /* our muxer gathers all topics "<ID>/web-interface-smart-device/touch_position" and extracts <ID> as identity */
      this.muxerTouchPositions = {
        id: uuidv4(),
        name: 'SmartDeviceGathererExample - TopicMux positions',
        dataType: 'vector2',
        topicSelector:
          UbiiClientService.getUUIDv4Regex() +
          '/web-interface-smart-device/touch_position',
        identityMatchPattern: UbiiClientService.getUUIDv4Regex()
      };

      /* our demuxer will publish to "<ID>/web-interface-smart-device/vibration_pattern" when provided the ID as outputTopicParams */
      this.demuxerVibrations = {
        id: uuidv4(),
        name: 'SmartDeviceGathererExample - TopicDemux vibrations',
        dataType: 'double',
        outputTopicFormat: '%s/web-interface-smart-device/vibration_pattern'
      };

      this.topicVibrationDistanceThreshold =
        '/' +
        UbiiClientService.getClientID() +
        '/smart_device_gatherer_example/vibration_distance_threshold';

      /* our session that contains the interaction and the mapping between "muxer -> interaction input" and "interaction output -> demuxer" */
      this.session = {
        id: uuidv4(),
        name: 'SmartDeviceGathererExample - Session',
        interactions: [this.interaction],
        ioMappings: [
          {
            interactionId: this.interaction.id,
            inputMappings: [
              {
                name: this.interaction.inputFormats[0].internalName,
                topicSource: this.muxerTouchPositions
              },
              {
                name: this.interaction.inputFormats[1].internalName,
                topicSource: this.topicVibrationDistanceThreshold
              }
            ],
            outputMappings: [
              {
                name: this.interaction.outputFormats[0].internalName,
                topicDestination: this.demuxerVibrations
              }
            ]
          }
        ]
      };

      this.device = {
        name: 'SmartDeviceGathererExample - Device',
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: this.topicVibrationDistanceThreshold,
            messageFormat: 'double',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          }
        ]
      };
    },
    updateSmartDevices: function() {
      if (!this.pollSmartDevices) {
        return;
      }

      UbiiClientService.client
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            let smart_device_touch_topic_index = topic.indexOf(
              '/web-interface-smart-device/touch_position'
            );
            if (smart_device_touch_topic_index !== -1) {
              let clientID = topic.substring(0, smart_device_touch_topic_index);

              if (!this.$data.clients.has(clientID)) {
                this.addClient(clientID, topic);
              }
            }
          });
        });

      setTimeout(this.updateSmartDevices, 1000);
    },
    getRandomColor: function() {
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
      document
        .getElementById('example-web-smart-devices-touch-positions')
        .appendChild(touchPosElement);

      // create client object with necessary info
      let client = {
        topicTouchPosition: topic,
        touchPosition: { x: undefined, y: undefined },
        color: touchPosElement.style.backgroundColor,
        touchPosIndicator: touchPosElement
      };
      this.$data.clients.set(clientID, client);

      UbiiClientService.client.subscribe(
        client.topicTouchPosition,
        touchPosition => {
          let boundingRect = document
            .getElementById('example-web-smart-devices-touch-positions')
            .getBoundingClientRect();

          client.touchPosition.x = Math.floor(
            touchPosition.x * boundingRect.width
          );
          client.touchPosition.y = Math.floor(
            touchPosition.y * boundingRect.height
          );

          client.touchPosIndicator.style.left =
            client.touchPosition.x.toString() + 'px';
          client.touchPosIndicator.style.top =
            client.touchPosition.y.toString() + 'px';
        }
      );
    }
  }
};
</script>

<style scoped lang="stylus">
.touch-position-area {
  margin: 5px;
  border: 3px solid white;
  height: 100% - 10px;
}

.touch-position-indicator {
  width: 2px;
  height: 2px;
}
</style>
