<template>
  <div class="topic-pub-tool-grid">
    <div>
      TopicDataRecord:
      <br />
      <button @click="publish">Publish</button>
      <div class="topic-pub-tool-info-text">
        Enter your record in the form of a JSON following the schema of
        <a
          href="https://github.com/SandroWeber/ubii-msg-formats/blob/develop/src/proto/topicData/topicDataRecord/topicDataRecord.proto"
          target="_blank"
        >
          TopicDataRecord.proto</a
        >
        <br />
        A timestamp will be automatically added if not given here.
      </div>
    </div>
    <codemirror class="topic-pub-tool-cm" v-model="localValue" :options="codemirror.options"></codemirror>
  </div>
</template>

<script>
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { codemirror } from 'vue-codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/theme/base16-dark.css';

export default {
  name: 'TopicPublisher',
  components: {
    codemirror: codemirror
  },
  data() {
    return {
      ubiiClientService: UbiiClientService.instance,
      topicDataRecord: {
        topic: '/my/topic/here',
        object2D: {
          id: 'abcdefgh-1234-abcd-1234-abcdefghijkl',
          pose: { position: { x: 0.1, y: 0.2 }, angle: 0.3 },
          userDataJson: '{"clientID":"266f1beb-abe8-44bb-ad13-d949aa62775f"}'
        }
      },
      codemirror: {
        options: {
          tabSize: 4,
          mode: 'text/javascript',
          theme: 'base16-dark',
          lineNumbers: true,
          line: true,
          readOnly: false,
          viewportMargin: Infinity
        }
      }
    };
  },
  computed: {
    localValue: {
      get() {
        return JSON.stringify(this.topicDataRecord, null, 4);
      },
      set(localValue) {
        //this.$emit('input', localValue);
        this.topicDataRecord = JSON.parse(localValue);
      }
    }
  },
  methods: {
    publish: async function() {
      if (!this.topicDataRecord.timestamp) {
        this.topicDataRecord.timestamp = UbiiClientService.instance.generateTimestamp();
      }
      await UbiiClientService.instance.waitForConnection();
      UbiiClientService.instance.publishRecord(this.topicDataRecord);
    }
  }
};
</script>

<style>
.topic-pub-tool-grid {
  display: grid;
  grid-gap: 25px;
  grid-template-rows: auto;
  grid-template-columns: 250px 1fr;
  margin: 25px;
}

.topic-pub-tool-info-text {
  margin-top: 15px;
}

.topic-pub-tool-cm {
  padding: 25px;
  overflow: auto;
}

.CodeMirror {
  height: 100% !important;
}
</style>
