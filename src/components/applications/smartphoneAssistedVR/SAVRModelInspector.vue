<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
// Parent
import SAVRScene from './SAVRScene';

// Rendering
import * as THREE from 'three';
import { loadObj } from './modules/threeHelper';

// Networking
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService';
import UbiiClientContent from '../sharedModules/UbiiClientContent';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { createUbiiSpecs } from './modules/ubiiHelper';

export default {
  name: 'SAVRModelInspector',
  extends: SAVRScene,
  components: { UbiiClientContent },

  data: function() {
    return {
      modelPrefab: undefined,
      gidCounter: 0,
      clients: new Map()
    };
  },

  methods: {
    // load resources asynchronously, called by parent
    onStart: function() {
      const ctx = this;

      loadObj('models/skeleton', model => {
        ctx.modelPrefab = model;
      });
    },

    // create specifications for the protobuf messages
    createOrientationSpecs: function(clientID, clientTopic) {
      const deviceName = this.$options.name; // get name property of current view

      const orientationInput = {
        internalName: 'orientation',
        messageFormat: 'vector3',
        topic: clientTopic // e.g. 08d58eb6-7b51-4bae-908b-b737cde85429/web-interface-smart-device/orientation
      };

      const orientationOutput = {
        internalName: 'orientation',
        messageFormat: 'vector3',
        topic: clientID + '/' + deviceName + '/orientation'
      };

      /* eslint-disable-next-line */
      const processingCallback = (input, output) => {
        /* eslint-disable */
        if (!input) {
          return;
        }

        const halfPI = Math.PI / 180;
        const deg2Rad = function(x) {
          return x * halfPI;
        };

        output.orientation = {
          x: deg2Rad(input.orientation.y),
          y: deg2Rad(input.orientation.x),
          z: deg2Rad(-input.orientation.z)
        };
      };

      const specs = createUbiiSpecs(
        deviceName,
        [orientationInput],
        [orientationOutput],
        processingCallback
      );

      return {
        session: specs.session,
        interaction: specs.interaction,
        topic: orientationOutput.topic
      };
    },

    // this is the main game loop, called by parent
    /* eslint-disable-next-line no-unused-vars */
    updateGameLoop: function(deltaTime) {
      this.clients.forEach(client => {
        if (client.orientation && client.model) {
          client.model.rotation.x = client.orientation.x;
          client.model.rotation.y = client.orientation.y;
          client.model.rotation.z = client.orientation.z;
        }
      });
    },

    // called by parent
    updateSmartDevices: function() {
      UbiiClientService.client
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            const topicIndex = topic.indexOf(
              '/web-interface-smart-device/orientation'
            );

            if (topicIndex !== -1) {
              const clientID = topic.substring(0, topicIndex);

              if (!this.$data.clients.has(clientID)) {
                this.addClient(clientID, topic);
              }
            }
          });
        });
    },

    addClient: function(clientID, topic) {
      // client object
      const client = {
        orientation: undefined,
        model: undefined,
        session: undefined,
        topic: undefined,
        gid: this.gidCounter++,
        subscribe: undefined
      };

      // check if model is loaded
      const checkForPrefab = () => {
        if (this.modelPrefab) {
          client.model = this.createClientModel(client);
        } else {
          setTimeout(checkForPrefab, 250);
        }
      };

      const specs = this.createOrientationSpecs(clientID, topic);
      client.session = specs.session;
      client.topic = specs.topic;

      // start our session (registering not necessary as we do not want to save it permanently)
      client.subscribe = (createModel = false) =>
        UbiiClientService.client
          .callService({
            topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
            session: client.session
          })
          .then(() => {
            // subscribe the topic
            UbiiClientService.client
              .subscribe(specs.topic, orientation => {
                client.orientation = orientation;
              })
              .then(() => {
                if (createModel) checkForPrefab();
              });
          });
      client.subscribe(true);

      // create the client
      this.clients.set(clientID, client);

      console.log('add client ' + clientID);
    },

    createClientModel: function(client) {
      const model = this.modelPrefab.clone();

      const pivotPoint = new THREE.Object3D();
      pivotPoint.add(model);
      model.position.set(0, -0.5, 0);

      const radius = 0.75;
      const height = 1.2;
      const rotationOffset = 45 * (client.gid - 1);
      const radians = THREE.Math.degToRad(180 - rotationOffset);

      // position client objects on a circle
      pivotPoint.position.set(
        radius * Math.sin(radians),
        height,
        radius * Math.cos(radians)
      );

      this.scene.add(pivotPoint);
      return pivotPoint;
    },

    onConnectToUbii: function() {
      // resubscribe to previous topics
      this.clients.forEach((v, k) => {
        v.subscribe();
      });
    },
    onDisconnectToUbii: function() {
      // unsubscribe and stop all sessions
      this.clients.forEach((v, k) => {
        UbiiClientService.client.unsubscribe(v.topic);

        UbiiClientService.client.callService({
          topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
          session: v.session
        });
      });
    }
  }
};
</script>
