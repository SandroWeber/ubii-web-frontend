<template>
  <div class="grid">
    <div>Data:</div>
    <codemirror v-model="localValue" :options="codemirror.options"></codemirror>
    <button @click="publish">Publish</button>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { codemirror } from 'vue-codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/base16-dark.css';

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
library.add(faPaperPlane);

/* eslint-disable no-console */

export default {
  name: 'TopicPublisher',
  components: {
    codemirror: codemirror
  },
  data() {
    return {
      ubiiClientService: UbiiClientService,
      topicDataRecord: {
        topic: '/123456/android_client/patient',
        object2D: {
          id: 'c45140af-0cbe-4c1d-88f2-78f39376a5b8',
          pose: { position: {x: 0.1, y:0.2}, angle: 0 },
          userDataJson: "{\"Classification\":\"BLACK\",\"Time\":1617119992565,\"clientID\":\"266f1beb-abe8-44bb-ad13-d949aa62775f\"}"
        }
      },
      codemirror: {
        options: {
          tabSize: 4,
          mode: 'text/javascript',
          theme: 'base16-dark',
          lineNumbers: true,
          line: true,
          readOnly: false
        }
      }
    };
  },
  computed: {
    localValue: {
      get() {
        return JSON.stringify(this.topicDataRecord);
      },
      set(localValue) {
        //this.$emit('input', localValue);
        this.topicDataRecord = JSON.parse(localValue);
      }
    }
  },
  methods: {
    publish: async function() {
      console.info('publish');
      console.info(this.topicDataRecord);
      this.topicDataRecord.timestamp = UbiiClientService.generateTimestamp();
      await UbiiClientService.waitForConnection();
      UbiiClientService.publishRecord(this.topicDataRecord);
    }
  }
};
</script>

<style scoped>
.warning {
  color: red;
}

.grid {
  display: grid;
  grid-gap: 25px;
  grid-template-rows: 500px 50px;
  grid-template-columns: 100px 600px;
  margin: 25px;
}

.vue-codemirror {
  height: 100%;
  background-color: cyan;
}
</style>
