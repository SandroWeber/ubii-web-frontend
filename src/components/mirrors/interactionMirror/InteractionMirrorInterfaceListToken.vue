<template>
  <div class="interaction-mirror-interface-list-token token">
    <span>
      {{name}}
    </span>
  </div>
</template>

<script>
  export default { 
    name: 'InteractionMirrorInterfaceListToken',
    components: {},
    props: {
      name: String,
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list-token
    order 1
    margin 5px
    padding 5px 10px 5px 10px
</style>
