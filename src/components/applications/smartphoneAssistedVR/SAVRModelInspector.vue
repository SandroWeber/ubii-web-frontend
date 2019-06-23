<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div id="savr-render-container" class="render-container"></div>
  </UbiiClientContent>
</template>

<script>
/* eslint-disable no-console */
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
      clientModel: undefined,
      gidCounter: 0,
      client: undefined,
      template: undefined,
      oldClients: [],
      taskStarted: false,
      hitCount: 0
    };
  },

  methods: {
    // load resources asynchronously, called by parent
    onStart: function() {
      const ctx = this;

      loadObj('models/skeleton', modell => {
        this.modelPrefab = modell;

        const model = this.modelPrefab.clone();
        const pivotPoint = new THREE.Object3D();
        this.template = pivotPoint;
        pivotPoint.add(model);
        model.position.set(0, -0.5, 0);

        pivotPoint.position.set(0, 1.2, -1);

        this.scene.add(pivotPoint);

        pivotPoint.add(new THREE.AxesHelper(0.5));
        model.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            child.material = child.material.clone();
            child.material.color.setHex(0xf49e42);
            child.material.transparent = true;
            child.material.opacity = 0;
          }
        });
        this.template.traverse(child => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
            child.material.transparent = true;
            child.material.opacity = 0;
          }
        });

        this.randomlyRotateTemplate();
      });

      var guiProp = {
        startTask: function() {
          if (ctx.startTask) {
            return;
          }

          ctx.template.traverse(child => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
              child.material.transparent = false;
            }
          });
          ctx.randomlyRotateTemplate();
          ctx.taskStarted = true;
          ctx.hitCount = 0;

          const id =
            'savr_mv_' +
            Math.random()
              .toString(36)
              .substring(7);

          const timeout = 30;
          setTimeout(() => {
            ctx.taskStarted = false;
            console.log(ctx.hitCount);
            ctx.generateFile({
              id: id,
              hitCount: ctx.hitCount,
              seconds: timeout,
              type: 'mv', // model viewer
              time: new Date()
            });

            this.template.traverse(child => {
              if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
                child.material.transparent = true;
                child.material.opacity = 0;
              }
            });
          }, timeout * 1000);
        }
      };

      this.gui.add(guiProp, 'startTask');
    },

    generateFile: function(data) {
      var dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(data));
      var downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', data.id + '.json');
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    },

    randomlyRotateTemplate: function() {
      const offset = 30;
      this.template.rotation.set(
        ((Math.random() * -(180 - offset * 2) - offset + 90) * Math.PI) / 180,
        ((Math.random() * -(180 - offset * 2) - offset + 90) * Math.PI) / 180,
        ((Math.random() * -(180 - offset * 2) - offset + 90) * Math.PI) / 180 //((0 * offset * 2 + offset) * -Math.PI) / 180
      );
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
      if (!this.client) return;

      if (this.client.orientation && this.clientModel) {
        this.clientModel.rotation.x = this.client.orientation.x;
        this.clientModel.rotation.y = this.client.orientation.y;
        this.clientModel.rotation.z = this.client.orientation.z;

        if (this.taskStarted) {
          var diff = THREE.Math.radToDeg(
            this.clientModel.quaternion.angleTo(this.template.quaternion)
          );
          if (diff < 20.0) {
            this.randomlyRotateTemplate();
            this.hitCount++;
          }
        }
      }
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

              // create new client if we dont have one yet or a new client just connected
              if (!this.$data.client) {
                this.createClient(clientID, topic);
              } else {
                if (!this.$data.oldClients.includes(clientID)) {
                  this.createClient(clientID, topic);
                }
              }
            }
          });
        });
    },

    createClient: function(clientID, topic) {
      this.oldClients.push(clientID);

      // client object
      const client = {
        orientation: undefined,
        session: undefined,
        topic: undefined,
        gid: this.gidCounter++,
        subscribe: undefined
      };
      this.client = client;

      const specs = this.createOrientationSpecs(clientID, topic);
      client.session = specs.session;
      client.topic = specs.topic;

      // start our session (registering not necessary as we do not want to save it permanently)
      client.subscribe = () =>
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
                if (!this.clientModel)
                  this.clientModel = this.createClientModel(client);
              });
          });
      client.subscribe();

      console.log('add client ' + clientID);
    },

    createClientModel: function(client) {
      const model = this.modelPrefab.clone();

      const pivotPoint = new THREE.Object3D();

      pivotPoint.add(new THREE.AxesHelper(0.5));
      pivotPoint.add(model);
      model.position.set(0, -0.5, 0);

      pivotPoint.position.set(0, 1.2, -1);

      this.scene.add(pivotPoint);
      return pivotPoint;
    },

    onConnectToUbii: function() {
      // resubscribe to previous topics
      if (this.client) this.client.subscribe();
    },
    onDisconnectToUbii: function() {
      // unsubscribe and stop all sessions
      UbiiClientService.client.unsubscribe(this.client.topic);

      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.client.session
      });
    }
  }
};
</script>
