<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div
      id="example-web-smart-devices-touch-positions"
      class="touch-position-area"
    ></div>
  </UbiiClientContent>
</template>

<script>
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiClientContent from '../sharedModules/UbiiClientContent';

/* eslint-disable no-console */

export default {
  name: 'ExampleGathererWebInterfaceSmartDevices',
  components: { UbiiClientContent },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    UbiiClientService.on(UbiiClientService.EVENTS.CONNECT, async () => {
      await this.startExample();
    });
    UbiiClientService.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.stopExample();
    });
    UbiiClientService.waitForConnection().then(() => {
      this.startExample();
    });
    UbiiClientService.onDisconnect(async () => {
      await this.stopExample();
    });
  },
  beforeDestroy: async function() {
    await this.stopExample();
  },
  data: () => {
    return {
      ubiiClientService: UbiiClientService,
      clients: new Map()
    };
  },
  methods: {
    startExample: function() {
      if (this.running) return;

      this.running = true;

      this.createUbiiSpecs();

      UbiiClientService.waitForConnection().then(() => {
        /* we register our device needed to publish the vibration distance threshold */
        UbiiClientService.registerDevice(this.device)
          .then(response => {
            if (response.id) {
              this.device = response;
              return response;
            } else {
              console.warn(response);
            }
          })
          .then(() => {
            /* we publish the vibration distance threshold */
            UbiiClientService.publishRecord({
              topic: this.topicVibrationDistanceThreshold,
              double: 0.03
            });

            UbiiClientService.subscribeTopic(
              this.topicTouchObjects,
              this.handleTouchObjects
            );

            /* we start the session with the specs created in createUbiiSpecs() */
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
                session: this.ubiiSession
              })
              .then(response => {
                if (response.session) {
                  this.ubiiSession = response.session;
                }
              });
          });
      });
    },
    stopExample: async function() {
      this.running = false;

      UbiiClientService.unsubscribeTopic(
        this.topicTouchObjects,
        this.handleTouchObjects
      );

      if (this.ubiiSession) {
        await UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
          session: this.ubiiSession
        });
      }

      if (this.device) {
        await UbiiClientService.deregisterDevice(this.device);
      }
    },
    createUbiiSpecs: function() {
      this.topicVibrationDistanceThreshold =
        '/' +
        UbiiClientService.getClientID() +
        '/smart_device_gatherer_example/vibration_distance_threshold';
      this.topicTouchObjects =
        '/' +
        UbiiClientService.getClientID() +
        '/smart_device_gatherer_example/touch_objects';

      this.device = {
        name: 'SmartDeviceGathererExample - Device',
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: this.topicVibrationDistanceThreshold,
            messageFormat: 'double',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          },
          {
            topic: this.topicTouchObjects,
            messageFormat: 'ubii.dataStructure.Object2DList',
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          }
        ]
      };

      /* this is the processing callback that compares touch positions and lets devices vibrate whose positions are close */
      let processCB = (deltaTime, inputs, outputs) => {
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

        /* publish all current touch positions as objects */
        let touchObjects = [];
        positionRecords.forEach(obj => {
          touchObjects.push({
            id: obj.identity,
            pose: {
              position: obj.data
            }
          });
        });
        outputs.touchObjects = {
          elements: touchObjects
        };
      };

      /* our processing module with the I/O specifications fitting the processCB */
      this.ubiiProcessingModule = {
        name: 'SmartDeviceGathererExample',
        processingMode: {
          frequency: {
            hertz: 30
          }
        },
        onProcessingStringified: processCB.toString(),
        inputs: [
          {
            internalName: 'muxTouchPositions',
            messageFormat: 'ubii.dataStructure.Vector2'
          },
          {
            internalName: 'vibrationDistanceThreshold',
            messageFormat: 'double'
          }
        ],
        outputs: [
          {
            internalName: 'demuxVibration',
            messageFormat: 'double'
          },
          {
            internalName: 'touchObjects',
            messageFormat: 'ubii.dataStructure.Object2DList'
          }
        ]
      };

      /* our muxer gathers all topics "<ID>/web-interface-smart-device/touch_position" and extracts <ID> as identity */
      this.muxerTouchPositions = {
        name: 'SmartDeviceGathererExample - TopicMux positions',
        dataType: 'vector2',
        topicSelector:
          UbiiClientService.getUUIDv4Regex() +
          '/web-interface-smart-device/touch_position',
        identityMatchPattern: UbiiClientService.getUUIDv4Regex()
      };

      /* our demuxer will publish to "<ID>/web-interface-smart-device/vibration_pattern" when provided the ID as outputTopicParams */
      this.demuxerVibrations = {
        name: 'SmartDeviceGathererExample - TopicDemux vibrations',
        dataType: 'double',
        outputTopicFormat: '%s/web-interface-smart-device/vibration_pattern'
      };

      /* our session that contains the processing module and the mapping between "muxer -> PM input" and "PM output -> demuxer" */
      this.ubiiSession = {
        name: 'SmartDeviceGathererExample - Session',
        processingModules: [this.ubiiProcessingModule],
        ioMappings: [
          {
            processingModuleName: this.ubiiProcessingModule.name,
            inputMappings: [
              {
                inputName: this.ubiiProcessingModule.inputs[0].internalName,
                topicSource: this.muxerTouchPositions
              },
              {
                inputName: this.ubiiProcessingModule.inputs[1].internalName,
                topicSource: this.topicVibrationDistanceThreshold
              }
            ],
            outputMappings: [
              {
                outputName: this.ubiiProcessingModule.outputs[0].internalName,
                topicDestination: this.demuxerVibrations
              },
              {
                outputName: this.ubiiProcessingModule.outputs[1].internalName,
                topicDestination: this.topicTouchObjects
              }
            ]
          }
        ]
      };
    },
    handleTouchObjects: function(object2DList) {
      if (object2DList.elements) {
        let touchPosAreaBoundingRect = document
          .getElementById('example-web-smart-devices-touch-positions')
          .getBoundingClientRect();

        // go through all transmitted objects
        object2DList.elements.forEach(obj2D => {
          // add if not part of the list
          if (!this.$data.clients.has(obj2D.id)) {
            this.addClient(obj2D.id);
          }

          let client = this.$data.clients.get(obj2D.id);
          // update position
          client.touchPosition.x = Math.floor(
            obj2D.pose.position.x * touchPosAreaBoundingRect.width
          );
          client.touchPosition.y = Math.floor(
            obj2D.pose.position.y * touchPosAreaBoundingRect.height
          );

          // update indicator
          client.touchPosIndicator.style.left =
            client.touchPosition.x.toString() + 'px';
          client.touchPosIndicator.style.top =
            client.touchPosition.y.toString() + 'px';
        });

        // remove all that are gone since last update
        this.$data.clients.forEach((client, id) => {
          if (
            !object2DList.elements.find(obj => {
              return obj.id === id;
            })
          ) {
            this.removeClient(id);
          }
        });
      }
    },
    getRandomColor: function() {
      let letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    addClient: function(clientID /*, topic*/) {
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
        touchPosition: { x: undefined, y: undefined },
        color: touchPosElement.style.backgroundColor,
        touchPosIndicator: touchPosElement
      };
      this.$data.clients.set(clientID, client);
    },
    removeClient(id) {
      if (!this.$data.clients.has(id)) {
        return;
      }

      let indicatorElement = this.$data.clients.get(id).touchPosIndicator;
      indicatorElement.parentNode.removeChild(indicatorElement);
      this.$data.clients.delete(id);
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
