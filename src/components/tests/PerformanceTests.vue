<template>
  <div class="performance-tests-grid">
    <div class="performance-tests-section">
      <performance-test-rtt class="performance-test"></performance-test-rtt>
      <performance-test-message-load class="performance-test" />
      <performance-test-fibonacci class="performance-test"></performance-test-fibonacci>
    </div>
  </div>
</template>

<script>
import PerformanceTestRTT from './PerformanceTestRTT.vue';
import PerformanceTestFibonacci from './PerformanceTestFibonacci.vue';
import PerformanceTestMessageLoad from './PerformanceTestMessageLoad.vue';

export default {
  name: 'PerformanceTests',
  components: {
    PerformanceTestRtt: PerformanceTestRTT,
    PerformanceTestFibonacci: PerformanceTestFibonacci,
    PerformanceTestMessageLoad
  }
};
</script>

<style scoped lang="stylus">
.performance-tests-grid {
  display: grid;
  grid-gap: 15px;
  grid-template-columns: 1fr;
}

.performance-tests-section {
  overflow: scroll;
}

.performance-test {
  margin: 20px;
  padding: 20px;
  border-bottom: 3px solid white;
}
</style>
