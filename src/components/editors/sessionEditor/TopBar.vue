<template>
    <div class="top-bar">

    </div>
</template>

<script>
  export default {
    name: 'TopBar',
    props: {
      session: {
        type: Object,
        required: true
      },
    }
  };
</script>

<style scoped lang="stylus">
    .top-bar {
        background-color: #2d2a2e;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid black;
    }
</style>