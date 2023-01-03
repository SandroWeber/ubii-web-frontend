<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div class="grid">
      <div class="seperator header-demo">
        <span class="separator-label">Demo</span>
      </div>

      <div class="options">
        <!-- a checkbox to toggle showing the client side pointer -->
        <input id="checkboxClientPointer" type="checkbox" v-model="showClientPointer" />
        <label for="checkboxClientPointer">Show Client Pointer</label>

        <br />

        <!-- a checkbox to toggle showing the server side pointer -->
        <input id="checkboxServerPointer" type="checkbox" v-model="showServerPointer" />
        <label for="checkboxServerPointer">Show Server Pointer</label>

        <br />

        <!-- a checkbox to toggle inverting the pointer position at the server before sending it back to client -->
        <input id="checkboxMirrorPointer" type="checkbox" v-model="mirrorPointer" />
        <label for="checkboxMirrorPointer">Mirror Pointer</label>

        <br />

        <!-- a checkbox to toggle immediate publishing of TopicDataRecords -->
        <input id="checkboxPublishImmediately" type="checkbox" v-model="publishImmediately" />
        <label for="checkboxPublishImmediately">Publish Immediately</label>

        <br />

        <!-- a checkbox to toggle immediate publishing of TopicDataRecords -->
        <input
          id="numberPublishInterval"
          type="number"
          v-model="publishIntervalMs"
          :disabled="publishImmediately"
          v-on:change="onPublishIntervalChange"
        />
        <label for="numberPublishInterval">Publish Interval (ms)</label>
      </div>

      <!-- the mouse area.
      if our pointer is inside, its position is sent to the server and back to us, then displayed as a red square-->
      <div
        id="walker-area"
        class="walker-area"
        v-bind:class="{ hideCursor: !showClientPointer }"
        v-on:mousemove="onMouseMove($event)"
        v-on:mouseenter="clientPointerInside = true"
        v-on:mouseleave="clientPointerInside = false"
        v-on:touchstart="onTouchStart($event)"
        v-on:touchend="clientPointerInside = false"
        v-on:touchmove="onTouchMove($event)"
      >
        <font-awesome-icon
          class="server-mouse-position-indicator"
          icon="circle"
          :style="{
            top: randomWalkerPosition.y - 4 + 'px',
            left: randomWalkerPosition.x - 4 + 'px'
          }"
        />
      </div>

      <div class="seperator header-description">
        <span class="separator-label">Description</span>
      </div>

      <div class="description-general">
        Placing your mouse inside the above area will show your mouse indicator (arrow) as well as a red square. The
        basic idea of this demo is to send the mouse position to the Ubi-Interact backend, which will send it back to us
        so we can display it (red square).
        <br />Reading the code of this example will show your how to register a device with Ubi-Interact defining the
        topics for data communication. It also shows you how to publish (send) and subcribe (receive) to topics. A small
        session + processing module is also specified and communicated to Ubi-Interact that can manipulate the
        communicated mouse position. You can see in the code how to specify this processing module on the client side,
        link it to the topics of our device and start it.
      </div>

      <div class="description-options">
        You can toggle whether the client/server side mouse indicator should be shown. "Mirror Pointer" will tell the
        processing module to invert your client mouse position in X and Y.
      </div>

      <div class="description-mouse-area">
        Moving your mouse inside this area will publish its current position normalized to ([0;1] , [0;1]) on the topic
        ".../mouse_client_position". A processing module in the backend will read this client position. If the flag
        "mirror pointer" is set, the processing module will invert the client position. The processing module will then
        write the new position to the topic ".../mouse_server_position", which we subscribe to. Once we receive data on
        the ".../mouse_server_position" topic, the position of the server pointer indicator (red square) will be
        updated.
      </div>
    </div>
  </UbiiClientContent>
</template>

<script>
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiClientContent from '../../sharedModules/UbiiClientContent';
import RandomWalker from './randomWalker';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircle } from '@fortawesome/free-solid-svg-icons';

library.add(faCircle);

export default {
  name: 'ExampleRandomWalker',
  components: { UbiiClientContent },
  /* STEP 1: mounted() is our vue component entry point, start here! */
  mounted: async function() {
    // unsubscribe before page is suddenly closed
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.startExample();
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.stopExample();
    });

    // make sure we're connected, then start the example
    this.startExample();
  },
  beforeDestroy: function() {
    this.stopExample();
  },
  data: () => {
    return {
      showClientPointer: false,
      showServerPointer: true,
      mirrorPointer: false,
      publishImmediately: false,
      publishIntervalMs: UbiiClientService.instance.getPublishIntervalMs(),
      ubiiClientService: UbiiClientService.instance,
      exampleStarted: false,
      clientMousePosition: { x: 0, y: 0 },
      serverMousePosition: { x: 0, y: 0 },
      clientPointerInside: false,
      randomWalker: new RandomWalker(0.05),
      randomWalkerPosition: { x: 50, y: 50 }
    };
  },
  watch: {
    mirrorPointer: function(value) {
      if (
        !UbiiClientService.instance.isConnected() ||
        !this.ubiiDevice.name ||
        !this.ubiiComponentMirrorPointer.topic
      ) {
        return;
      }

      this.publishMirrorPointer(value);
    }
  },
  methods: {
    startExample: async function() {
      if (this.exampleStarted) {
        return;
      }
      this.exampleStarted = true;

      await UbiiClientService.instance.waitForConnection();

      // create all the specifications we need to define our example application
      // these are protobuf messages to be sent to the server (saved in this.$data)
      await this.randomWalker.init();

      this.subTokenPositionOwnedRandomWalker = await UbiiClientService.instance.subscribeTopic(
        this.randomWalker.component.topic,
        record => {
          let areaBoundClientRect = document.getElementById('walker-area').getBoundingClientRect();
          this.randomWalkerPosition.x = record.vector2.x * areaBoundClientRect.width;
          this.randomWalkerPosition.y = record.vector2.y * areaBoundClientRect.height;
        }
      );

      let replySubComponent = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.TOPIC_SUBSCRIPTION,
        topicSubscription: {
          clientId: UbiiClientService.instance.getClientID(),
          subscribeComponents: [RandomWalker.CONSTANTS.UBII_COMPONENT_TEMPLATE]
        }
      });
      console.info('replySubComponent');
      console.info(replySubComponent);
    },
    stopExample: async function() {
      if (!this.exampleStarted) return;

      /*UbiiClientService.instance.setPublishIntervalMs(15);
      this.exampleStarted = false;

      // unsubscribe and stop session
      await UbiiClientService.instance.unsubscribeTopic(
        this.ubiiComponentServerPointer.topic,
        this.subscriptionServerPointerPosition
      );
      await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.ubiiSession,
      });

      if (this.ubiiDevice) {
        await UbiiClientService.instance.deregisterDevice(this.ubiiDevice);
      }*/
    },
    /* publishing and subscribing */
    subscriptionServerPointerPosition: function(vec2) {
      // when we get a normalized server pointer position, we calculate back to absolute (x,y) within the
      // mouse area and set our red square indicator
      let boundingRect = document.getElementById('walker-area').getBoundingClientRect();
      this.$data.serverMousePosition = {
        x: vec2.x * boundingRect.width,
        y: vec2.y * boundingRect.height
      };
    },
    publishClientPointerPosition: function(vec2) {
      if (this.publishImmediately) {
        UbiiClientService.instance.publishRecordImmediately({
          topic: this.ubiiComponentClientPointer.topic,
          vector2: vec2
        });
      } else {
        // publish our normalized client mouse position
        UbiiClientService.instance.publishRecord({
          topic: this.ubiiComponentClientPointer.topic,
          vector2: vec2
        });
      }
    },
    publishMirrorPointer: function(boolean) {
      // if the checkbox is changed, we publish this info on the related topic
      UbiiClientService.instance.publishRecord({
        topic: this.ubiiComponentMirrorPointer.topic,
        bool: boolean
      });
    },
    onPublishIntervalChange: function(event) {
      UbiiClientService.instance.setPublishIntervalMs(event.target.value);
    },
    /* UI events */
    onMouseMove: function(event) {
      /*if (!this.exampleStarted) {
        return;
      }

      // calculate the current mouse position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let boundingRect = document
        .getElementById("mouse-pointer-area")
        .getBoundingClientRect();
      let relativeMousePosition = {
        x: (event.clientX - boundingRect.left) / boundingRect.width,
        y: (event.clientY - boundingRect.top) / boundingRect.height,
      };

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client mouse position
      this.publishClientPointerPosition(this.$data.clientMousePosition);*/
    },
    onTouchStart: function(event) {
      /*this.$data.clientPointerInside = true;
      this.onTouchMove(event);*/
    },
    onTouchMove: function(event) {
      /*if (!this.exampleStarted) {
        return;
      }

      // calculate the current touch position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let relativeMousePosition = {
        x: (event.touches[0].clientX - event.target.offsetLeft) / event.target.offsetWidth,
        y: (event.touches[0].clientY - event.target.offsetTop) / event.target.offsetHeight
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
      this.publishClientPointerPosition(this.$data.clientMousePosition);*/
    }
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 2fr 6fr;
  grid-template-rows: 30px 300px auto 30px auto;
  grid-template-areas:
    'header-demo header-demo'
    'demo-options demo-mouse-area'
    'description-options description-mouse-area'
    'header-description header-description'
    'description-general description-general';
  height: 100%;
}

.options {
  grid-area: demo-options;
  margin: 25px;
}

.walker-area {
  grid-area: demo-mouse-area;
  margin: 10px;
  border: 3px solid white;
}

.hideCursor {
  cursor: none;
}

.server-mouse-position-indicator {
  position: relative;
}

.start-example {
  text-align: center;
  margin-top: 25px;
}

.start-example-button {
  width: 50px;
  height: 50px;
}

.description-general {
  grid-area: description-general;
  padding: 20px;
}

.description-options {
  grid-area: description-options;
  padding: 20px;
}

.description-mouse-area {
  grid-area: description-mouse-area;
  padding: 20px;
}

.header-demo {
  grid-area: header-demo;
  margin: 10px;
}

.header-description {
  grid-area: header-description;
  margin: 10px;
}

.seperator {
  border-bottom: solid 1px orange;
  height: 10px;
  line-height: 20px;
  text-align: left;
}

.separator-label {
  display: inline;
  padding-left: 15px;
  padding-right: 20px;
  color: orange;
  background-color: black;
}
</style>
