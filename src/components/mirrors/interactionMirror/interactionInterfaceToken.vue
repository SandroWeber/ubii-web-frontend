<template>
  <div class="interaction-interface-token token">
    <span>
      {{name}}
    </span>
  </div>
</template>

<script>
  export default { 
    name: 'interactionInterfaceToken',
    components: {},
    props: {
      name: String,
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-interface-token
    order 1
    margin 5px
    padding 5px 10px 5px 10px
</style>
