<template>
    <div>
        <UbiiClientContent :ubiiClientService="ubiiClientService">
            <div class="session-editor">
                <side-bar class="side-bar-instance" :session="selectedSession" :selected="0"></side-bar>
                <div class="main">
                    <top-bar class="top-bar-instance"></top-bar>


                    <graph-view></graph-view>
                </div>
            </div>
        </UbiiClientContent>
    </div>
</template>

<script>
  import TopBar from './TopBar.vue';
  import SideBar from './SideBar.vue';
  import GraphView from './GraphView.vue';

  import UbiiClientContent from '../../applications/sharedModules/UbiiClientContent';
  import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

  import uuidv4 from 'uuid/v4';
  import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
  import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
  import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

  import { mapActions } from 'vuex';

  /* fontawesome */
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faPlay } from '@fortawesome/free-solid-svg-icons';

  library.add(faPlay);

  export default {
    name: 'SessionEditor',
    components: {
      TopBar: TopBar,
      SideBar: SideBar,
      GraphView: GraphView,
      UbiiClientContent
    },
    data: () => {
      return {
        selectedSession: {
          name:'Testsession',
          interactions: [
            {
              id: 0,
              label: 'Interaction 1'
            },
            {
              id: 1,
              label: 'Interaction 2'
            },
            {
              id: 2,
              label: 'Interaction 3'
            },
            {
              id: 3,
              label: 'Interaction 4'
            },
            {
              id: 4,
              label: 'Interaction 5'
            },
            {
              id: 5,
              label: 'Interaction 6'
            }
          ]
        },
        ubiiClientService: UbiiClientService,
      };
    },
    /* STEP 1: mounted() is our vue component entry point, start here! */
    mounted: function() {
      // unsubscribe before page is suddenly closed
      window.addEventListener('beforeunload', () => {
        this.stopExample();
      });

      // some event hooks to restart/stop the experiment if necessary
      UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
        this.stopExample();
        this.startExample();
      });

      // make sure we're connected, then start the example
      UbiiClientService.isConnected().then(() => {
        this.startExample();
      });

      UbiiClientService.onDisconnect(() => {
        this.stopExample();
      });
    },
    beforeDestroy: function() {
      this.stopExample();
    },
    watch: {
      mirrorPointer: function(value) {
        if (
          !UbiiClientService.isConnected ||
          !this.$data.ubiiDevice.name ||
          !this.$data.inputMirror.topic
        ) {
          return;
        }

        // if the checkbox is changed, we publish this info on the related topic
        UbiiClientService.publishRecord({
          topic: this.$data.inputMirror.topic,
          bool: value
        });
      }
    },
    methods: {
      createUbiiSpecs: function() {
        // create specifications for the protobuf messages

        // helper definitions that we can reference later
        let deviceName = 'session-editor';
        let topicPrefix =
          '/' + UbiiClientService.getClientID() + '/' + deviceName;
        let outputServerPointer = {
          internalName: 'serverPointer',
          messageFormat: 'ubii.dataStructure.Vector2',
          topic: topicPrefix + '/' + 'mouse_server_position'
        };

        // specification of a ubii.devices.Device
        // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
        let ubiiDevice = {
          name: deviceName,
          deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
          components: [
            {
              topic: outputServerPointer.topic,
              messageFormat: outputServerPointer.messageFormat,
              ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
            }
          ]
        };

        // specification of a ubii.interactions.Interaction
        // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/interactions/interaction.proto
        let processingCallback = (input, output) => {

        };

        let ubiiInteraction = {
          id: uuidv4(),
          name: 'session-editor-listener',
          processingCallback: processingCallback.toString(),
          processFrequency: 60,
          inputFormats: [],
          outputFormats: [
            {
              internalName: outputServerPointer.internalName,
              messageFormat: outputServerPointer.messageFormat
            }
          ]
        };

        // specification of a ubii.sessions.Session
        // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
        let ubiiSession = {
          id: uuidv4(),
          name: 'session-editor-listener-session',
          interactions: [ubiiInteraction],
          ioMappings: [
            {
              interactionId: ubiiInteraction.id,
              inputMappings: [],
              outputMappings: [
                {
                  name: outputServerPointer.internalName,
                  topicDestination: outputServerPointer.topic
                }
              ]
            }
          ]
        };

        // assign to local state for future reference
        this.$data.deviceName = deviceName;
        this.$data.outputServerPointer = outputServerPointer;
        this.$data.ubiiDevice = ubiiDevice;
        this.$data.ubiiInteraction = ubiiInteraction;

        this.$data.ubiiSession = ubiiSession;
      },
      /* STEP 2: making all calls related to ubi-interact backend */
      startExample: function() {
        // make sure we're connected, then continue
        UbiiClientService.isConnected().then(() => {
          // create all the specifications we need to define our example application
          // these are protobuf messages to be sent to the server (saved in this.$data)
          this.createUbiiSpecs();

          // register the mouse pointer device
          UbiiClientService.registerDevice(this.$data.ubiiDevice)
            .then(response => {
              // the device specs we send to backend intentionally left out the device ID
              // if the backend accepts the device registration, it will send back our specs
              // plus any necessary info (like the ID) filled in by the backend
              // that way we make sure the ID is created by the backend and valid
              if (response.id) {
                // success, we accept the device specs sent back to us as the final specs
                this.$data.ubiiDevice = response;
                return this.$data.ubiiDevice;
              } else {
                // something went wrong, print to console
                return undefined;
              }
            })
            .then(() => {
              // subscribe to the device topics so we are notified when new data arrives on the topic
              UbiiClientService.subscribe(
                this.$data.outputServerPointer.topic,
                // a callback to be called when new data on this topic arrives
                mousePosition => {
                  // when we get a normalized server pointer position, we calculate back to absolute (x,y) within the
                  // interaction area and set our red square indicator
                  let boundingRect = document
                    .getElementById('mouse-pointer-area')
                    .getBoundingClientRect();
                  this.$data.serverMousePosition = {
                    x: mousePosition.x * boundingRect.width,
                    y: mousePosition.y * boundingRect.height
                  };
                }
              );

              // start our session (registering not necessary as we do not want to save it permanently)
              UbiiClientService.client
                .callService({
                  topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                  session: this.$data.ubiiSession
                })
                .then(response => {
                  if (response.success) {
                    this.$data.exampleStarted = true;
                  }
                });
            });
        });
      },
      stopExample: async function() {
        if (!this.exampleStarted) return;

        this.exampleStarted = false;

        // unsubscribe and stop session
        UbiiClientService.unsubscribe(this.$data.outputServerPointer.topic);
        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: this.$data.ubiiSession
        });

        if (this.$data.ubiiDevice) {
          await UbiiClientService.deregisterDevice(this.$data.ubiiDevice);
        }
      },
      onMouseMove: function(event) {
        if (!this.exampleStarted) {
          return;
        }

        // calculate the current mouse position, normalized to the bounds of the interactive area ([0;1], [0;1])
        let boundingRect = document
          .getElementById('mouse-pointer-area')
          .getBoundingClientRect();
        let relativeMousePosition = {
          x: (event.clientX - boundingRect.left) / boundingRect.width,
          y: (event.clientY - boundingRect.top) / boundingRect.height
        };

        this.$data.clientMousePosition = relativeMousePosition;
        // publish our normalized client mouse position
        UbiiClientService.publishRecord({
          topic: this.$data.inputClientPointer.topic,
          vector2: this.$data.clientMousePosition
        });
      },
      onTouchStart: function(event) {
        this.$data.clientPointerInside = true;
        this.onTouchMove(event);
      },
      onTouchMove: function(event) {
        if (!this.exampleStarted) {
          return;
        }

        // calculate the current touch position, normalized to the bounds of the interactive area ([0;1], [0;1])
        let relativeMousePosition = {
          x:
            (event.touches[0].clientX - event.target.offsetLeft) /
            event.target.offsetWidth,
          y:
            (event.touches[0].clientY - event.target.offsetTop) /
            event.target.offsetHeight
        };

        if (
          relativeMousePosition.x < 0 ||
          relativeMousePosition.x > 1 ||
          relativeMousePosition.y < 0 ||
          relativeMousePosition.y > 1
        ) {
          this.$data.clientPointerInside = false;
          return;
        }

        this.$data.clientMousePosition = relativeMousePosition;
        // publish our normalized client touch position
        UbiiClientService.publishRecord({
          topic: this.$data.inputClientPointer.topic,
          vector2: this.$data.clientMousePosition
        });
      },
      ...mapActions('interactions', {
        addInteraction: 'add'
      })
    }
  };
</script>

<style scoped lang="stylus">
    .main {
        flex-basis: 0;
        flex-grow: 999;
        box-shadow: -1px 1px 10px 0px #101010;
    }

    .session-editor {
        height: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        flex-wrap: wrap;
        align-items: stretch;
        align-content: flex-start;
    }

    .side-bar-instance {
        flex-basis: 300px;
    }

    .top-bar-instance {
        height: 200px;
    }
</style>
