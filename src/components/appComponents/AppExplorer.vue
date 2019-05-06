<template>

</template>

<script>
  export default {
    name: 'AppExplorer',
    props: [
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
@import "./../../styles/main/color"
</style>
