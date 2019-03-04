<template>
  <div class="interaction-mirror-header medium-contrast">
        <h3>
          {{name}}  (ID {{id}})
        </h3>
  </div>
</template>

<script>
  export default { 
    name: 'InteractionMirrorHeader',
    components: {},
    props: {
      name: String,
      id: String
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-header
    text-align: center
</style>
