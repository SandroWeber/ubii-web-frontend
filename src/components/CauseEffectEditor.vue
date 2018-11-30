<template>
  <div class="codemirror-wrapper">
    <codemirror v-model="code" :options="cmOptions"></codemirror>
  </div>
</template>

<script>
  // codemirror
  import { codemirror } from 'vue-codemirror'
  import 'codemirror/lib/codemirror.css'
  import 'codemirror/mode/javascript/javascript.js'
  import 'codemirror/theme/base16-dark.css'

  export default {
    name: 'CauseEffectEditor',
    components: {
      codemirror
    },
    data: () => {
      return {
        code: '(inout, state) => { return true; }',
        cmOptions: {
          tabSize: 4,
          mode: 'text/javascript',
          theme: 'base16-dark',
          lineNumbers: true,
          line: true
        }
      };
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .codemirror-wrapper {
    text-align: left;
  }
</style>
