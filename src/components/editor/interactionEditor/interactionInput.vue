<template>
  <div class="interaction-input">
      <interaction-interface-token v-for="input in input" :key="input.name" :name="input.name"/>
  </div>
</template>

<script>
  import interactionInterfaceToken from "./interactionInterfaceToken.vue";

  export default { 
    name: 'interactionInput',
    components: {
      interactionInterfaceToken: interactionInterfaceToken
    },
    props: {
      input: Array
    }
  } 
</script> 

<style scoped lang="stylus"> 

</style>
