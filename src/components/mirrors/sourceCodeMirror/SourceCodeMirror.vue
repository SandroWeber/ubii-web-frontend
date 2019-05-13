<template>
  <div class="code-mirror">
    <codemirror
      v-model="localValue"
      :options="codemirror.options"
    >
    </codemirror>
  </div>
</template>

<script>
  import { codemirror } from 'vue-codemirror';
  import 'codemirror/lib/codemirror.css';
  import 'codemirror/mode/javascript/javascript.js';
  import 'codemirror/theme/base16-dark.css';

  export default {
    name: 'SourceCodeMirror',
    props: ['value'],
    components: {
        codemirror: codemirror,
    },
    data: () => {
      return {
        codemirror: {
          options: {
            tabSize: 4,
            mode: 'text/javascript', 
            theme: 'base16-dark',
            lineNumbers: true,
            line: true
          }
        } 
      };
    },
    computed:{
      localValue: {
        get() {
          return this.value
        },
        set(localValue) {
          this.$emit('input', localValue)
        }
      }
    },
    methods: {
    },
    mounted: function(){
      var myElements = document.querySelectorAll(".CodeMirror");

      for (var i = 0; i < myElements.length; i++) {
        myElements[i].style.height = '100%';
      }
    }
  }
</script>

<style scoped lang="stylus">
  .code-mirror
    height 100%
    padding: 0px
    flex-grow: 1
  
  .vue-codemirror
    height 100%
    background-color: cyan
</style>
