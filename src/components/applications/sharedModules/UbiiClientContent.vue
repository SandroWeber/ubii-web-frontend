<template>
  <div class="full-height">
    <div v-show="!ubiiClientService.connected">
      <span class="notification">Please connect to backend before starting the application.</span>
    </div>

    <div v-show="ubiiClientService.connected" class="full-height">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "UbiiClientContent",
  props: {
    ubiiClientService: Object
  }
};
</script>

<style scoped lang="stylus">
.full-height {
  height: 100%;
}

.notification {
  color: red;
}
</style>
