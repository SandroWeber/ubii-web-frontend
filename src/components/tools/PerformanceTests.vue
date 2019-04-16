<template>
    <div class="performance-tests-grid">
        <div class="performance-tests-section">
            <performance-test-rtt></performance-test-rtt>
        </div>
    </div>
</template>

<script>
  import PerformanceTestRTT from './PerformanceTestRTT.vue';

  export default {
    name: 'PerformanceTests',
    components: {
      PerformanceTestRtt: PerformanceTestRTT
    }
  }
</script>

<style scoped lang="stylus">
    .performance-tests-grid
        display: grid
        grid-gap: 15px
        grid-template-columns: 1fr

    .performance-tests-section
        border-bottom: 3px solid white
        margin: 15px
</style>
