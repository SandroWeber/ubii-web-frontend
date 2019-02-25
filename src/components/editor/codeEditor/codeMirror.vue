<template>
    <div class="code-mirror">
        <codemirror v-model="code" @input="onCodeChange" :options="codemirror.options"></codemirror>
    </div>
</template>

<script>
    // Codemirror.
    import { codemirror } from 'vue-codemirror';
    import 'codemirror/lib/codemirror.css';
    import 'codemirror/mode/javascript/javascript.js';
    import 'codemirror/theme/base16-dark.css';

    export default {
        name: 'codeMirror',
        props: {
            code: Object
        },
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
        methods: {
            onCodeChange: function(value) {
                this.code = value
                this.$emit('onCodeChange', this.code);
            }
        }
    }
</script>

<style scoped lang="stylus">
    .code-mirror
        height 100%
        padding: 10px
        flex-grow: 1
</style>
