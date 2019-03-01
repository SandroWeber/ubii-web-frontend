<template>
  <div class="interaction-output">
      <interaction-interface-token
        v-for="output in output"
        :key="output.name"
        :name="output.name"
      />
  </div>
</template>

<script>
  import interactionInterfaceToken from "./interactionInterfaceToken.vue";

  export default { 
    name: 'interactionOutput',
    components: {
      interactionInterfaceToken: interactionInterfaceToken
    },
    props: {
      output: Array
    }
  } 
</script> 

<style scoped lang="stylus"> 
</style>
