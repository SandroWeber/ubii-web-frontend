<template>
  <div class="interaction-header">
        <h2>{{name}}  (ID {{id}})</h2>
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
    color: cyan;
    background: black;
    text-align: center;
</style>
