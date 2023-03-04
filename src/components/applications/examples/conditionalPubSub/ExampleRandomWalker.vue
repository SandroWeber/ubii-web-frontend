<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div class="grid">
      <div class="seperator header-demo">
        <span class="separator-label">Demo</span>
      </div>

      <div class="options">...</div>

      <div id="walker-area" class="walker-area"></div>

      <div class="seperator header-description">
        <span class="separator-label">Description</span>
      </div>

      <div class="description-general">
        ...
      </div>

      <div class="description-options">
        ...
      </div>

      <div class="description-mouse-area">
        Client ID: {{ clientId }}
        <br />
        Device ID: {{ deviceId }}
        <br />
        Component Position ID: {{ componentPositionId }}
        <br />
        Topic Position: {{ topicPos }}
      </div>
    </div>
  </UbiiClientContent>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiClientContent from '../../sharedModules/UbiiClientContent';
import RandomWalker from './randomWalker';
import BounceWalker from './bounceWalker';

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
      setTimeout(this.startExample, 500);
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
      ubiiClientService: UbiiClientService.instance,
      exampleStarted: false,
      walker: /*new RandomWalker(0.025)*/ new BounceWalker(0.05),
      clientId: 'unknown',
      deviceId: 'unknown',
      componentPositionId: 'unknown',
      topicPos: 'unknown',
      walkers: new Map()
    };
  },
  methods: {
    startExample: async function() {
      if (this.exampleStarted) {
        return;
      }
      this.exampleStarted = true;
      this.subTokens = [];

      this.walkerZIndex = 0;

      await UbiiClientService.instance.waitForConnection();
      this.clientId = UbiiClientService.instance.getClientID();

      // create all the specifications we need to define our example application
      // these are protobuf messages to be sent to the server (saved in this.$data)
      await this.walker.init();
      this.deviceId = this.walker.device.id;
      this.componentPositionId = this.walker.componentPosition.id;
      this.topicPos = this.walker.componentPosition.topic;
      let boundingRectWalkerArea = document.getElementById('walker-area').getBoundingClientRect();
      this.createWalkerVisualization(
        this.topicPos,
        [255, 0, 0, 0.3] /*'#FF0000'*/ /*this.walker.colorHex*/,
        this.walker.CONSTANTS.MAX_SUB_DISTANCE * boundingRectWalkerArea.width * 2
      );

      let subTokenPosComponent = await UbiiClientService.instance.subscribeComponents(
        this.walker.CONSTANTS.UBII_COMPONENT_POSITION_TEMPLATE,
        record => this.cbWalkerPositionUpdate(record)
      );
      this.subTokens.push(subTokenPosComponent);

      this.intervalUpdateWalkers = setInterval(this.updateWalkers, 500);
    },
    stopExample: async function() {
      this.intervalUpdateWalkers && clearInterval(this.intervalUpdateWalkers);

      for (let token of this.subTokens) {
        UbiiClientService.instance.unsubscribe(token);
      }
    },
    createWalkerVisualization: function(topicPos, rgbaArray, pixelSize) {
      if (this.walkers.has(topicPos)) {
        console.warn(`walker for topic "${topicPos}" already exists`);
        return;
      }

      let walkerAreaElement = document.getElementById('walker-area');
      console.info(walkerAreaElement);

      let walkerDiv = document.createElement('div');
      walkerDiv.style.width = pixelSize + 'px';
      walkerDiv.style.height = pixelSize + 'px';
      walkerDiv.style.position = 'absolute';
      walkerDiv.style.backgroundColor = `rgba(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]}, ${rgbaArray[3]})`;
      //walkerDiv.style.color = white;
      walkerDiv.style.borderRadius = '50%';
      walkerDiv.style.zIndex = this.walkerZIndex++;
      /*walkerDiv.style.border = '1px solid';
      walkerDiv.style.borderRadius = '5px';*/
      walkerAreaElement.appendChild(walkerDiv);

      // create client object with necessary info
      let walker = {
        div: walkerDiv,
        pixelSize: pixelSize,
        topic: topicPos,
        pos: { x: 0, y: 0 }
      };

      this.walkers.set(topicPos, walker);

      return walker;
    },
    cbWalkerPositionUpdate: function(record) {
      let walker = this.walkers.get(record.topic);
      if (!walker) {
        walker = this.createWalkerVisualization(record.topic, [255, 255, 255, 1], 4);
        console.info('new walker detected! topic=' + record.topic);
      }

      if (record.vector2) {
        walker.tLastUpdate = Date.now();

        walker.pos.x = record.vector2.x;
        walker.pos.y = record.vector2.y;
      }
    },
    updateWalkers: function() {
      let walkerAreaElement = document.getElementById('walker-area');
      let areaBoundClientRect = walkerAreaElement.getBoundingClientRect();
      //console.info(areaBoundClientRect);

      for (let walker of this.walkers.values()) {
        let tNow = Date.now();
        if (walker.tLastUpdate && tNow - walker.tLastUpdate > 5000) {
          this.walkers.delete(walker.topic);
          console.info(`walker on topic "${walker.topic}" removed due to inactivity`);
        } else if (walker.tLastUpdate && tNow - walker.tLastUpdate > 1500) {
          walker.div.style.visibility = 'hidden';
          console.info(`walker on topic "${walker.topic}" hidden due to inactivity`);
        } else {
          walker.div.style.visibility = 'visible';
          walker.div.style.left =
            areaBoundClientRect.left +
            Math.floor(walker.pos.x * areaBoundClientRect.width) -
            walker.pixelSize / 2 +
            'px';
          walker.div.style.top =
            areaBoundClientRect.top +
            Math.floor(walker.pos.y * areaBoundClientRect.height) -
            walker.pixelSize / 2 +
            'px';
        }
      }

      /*if (this.tLastUpdateWalkers) {
        console.info('delay between visual updates: ' + (Date.now() - this.tLastUpdateWalkers));
      }
      this.tLastUpdateWalkers = Date.now();*/
    }
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 50px auto;
  grid-template-rows: 30px 550px auto 30px auto;
  grid-template-areas:
    'header-demo header-demo'
    'demo-options walker-area'
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
  grid-area: walker-area;
  margin: 0px;
  border: 1px solid white;
  width: 500px;
  height: 500px;
}

.hideCursor {
  cursor: none;
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
