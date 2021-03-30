<template>
  <div class="grid">
    <div>Topic:</div>
    <input v-model="topic">
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
      topic: '',
      data: JSON.stringify({
        topic: '/your/topic/here',
        bool: true
      }),
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
  mounted() {
    
  },
  computed: {
    localValue: {
      get() {
        return this.data;
      },
      set(localValue) {
        this.$emit('input', localValue);
        this.data = localValue;
      }
    }
  },
  methods: {
    publish: async function() {
      console.info('publish');
      console.info(this.topic);
      console.info(this.data);
      //await UbiiClientService.waitForConnection();
      //UbiiClientService.publish(topic, data)
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
  grid-template-rows: 50px 500px 50px;
  grid-template-columns: 100px auto;
  margin: 25px;
}

.vue-codemirror {
  height: 100%;
  background-color: cyan;
}
</style>
