<template>
  <div
    class="interaction-header medium-contrast">
        <h3>
          {{name}}  (ID {{id}})
        </h3>
  </div>
</template>

<script>
  export default { 
    name: 'interactionHeader',
    components: {},
    props: {
      name: String,
      id: String
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-header
    text-align: center
</style>
