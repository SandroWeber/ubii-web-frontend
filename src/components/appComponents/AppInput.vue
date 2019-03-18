<template>
    <input
        class="app-input"
        :id="id" 
        :type="type"
        v-model="localValue"
    />
</template>

<script>

    export default {
        name: 'AppInput',
        props: ['value', 'id', 'type'],
        components: {
        },
        data: () => {
            return {
            };
        },
        computed: {
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
        }
    }
</script>

<style scoped lang="stylus">
    .code-mirror
        height 100%
        padding: 0px
        flex-grow: 1
</style>
