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
        props: [
            'value',
            'id',
            'type'
        ],
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
    }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/base/color"

.app-input
    z-index: 4000
    color: highContrastColor
    background-color: layerFourSecondaryColor
    border-width: layerBorderWidth
    border-style: solid
    border-color: layerFourBorderColor
    &.round
        border-radius: layerBorderRadius
</style>
