<template>
  <div class="interaction-interface-list">
      <interaction-interface-token  v-for="element in interfaceList"
                                    :key="element.name"
                                    :name="element.name"/>
  </div>
</template>

<script>
  import interactionInterfaceToken from "./interactionInterfaceToken.vue";

  export default { 
    name: 'interactionInterfaceList',
    components: {
      interactionInterfaceToken: interactionInterfaceToken
    },
    props: {
      interfaceList: Array
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-interface-list
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    justify-content: flex-start
    align-items: flex-start
    align-content: flex-start
    padding: 10px
</style>
