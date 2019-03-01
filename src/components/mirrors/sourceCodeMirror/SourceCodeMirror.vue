<template>
    <div class="code-mirror">
        <codemirror
            :value="value"
            @input="onCodeChange"
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
        methods: {
            onCodeChange: function(value) {
                this.$emit('input', value);
            }
        }
    }
</script>

<style scoped lang="stylus">
    .code-mirror
        height 100%
        padding: 0px
        flex-grow: 1
</style>
