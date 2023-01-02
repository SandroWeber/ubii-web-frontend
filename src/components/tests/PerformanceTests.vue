<template>
  <div class="performance-tests-grid">
    <div class="performance-tests-section">
      <performance-test-rtt class="performance-test"></performance-test-rtt>
      <performance-test-message-load class="performance-test" />
      <performance-test-fibonacci class="performance-test"></performance-test-fibonacci>
      <test-notify-condition class="performance-test" />
    </div>
  </div>
</template>

<script>
import PerformanceTestRTT from './performance/rtt/PerformanceTestRTT.vue';
import PerformanceTestFibonacci from './PerformanceTestFibonacci.vue';
import PerformanceTestMessageLoad from './PerformanceTestMessageLoad.vue';
import TestNotifyCondition from './conditionalPubSub/TestNotifyConditionTopicBased.vue';

export default {
  name: 'PerformanceTests',
  components: {
    PerformanceTestRtt: PerformanceTestRTT,
    PerformanceTestFibonacci: PerformanceTestFibonacci,
    PerformanceTestMessageLoad,
    TestNotifyCondition
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
