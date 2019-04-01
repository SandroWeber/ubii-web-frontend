<template>
  <div class="interaction-mirror-interface-list">
      <interaction-mirror-interface-list-token 
        v-for="element in interfaceList"
        :key="element.internalName"
        :name="element.internalName"
        :interface-key="interfaceKey"
        :code="code"
      />
  </div>
</template>

<script>
  import InteractionMirrorInterfaceListToken from "./InteractionMirrorInterfaceListToken.vue";

  export default { 
    name: 'interactionInterfaceList',
    components: {
      InteractionMirrorInterfaceListToken: InteractionMirrorInterfaceListToken
    },
    props: {
      interfaceList: Array,
      interfaceKey: String,
      code: String
    },
    
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list
    display: flex
    flex-direction: row
    flex-wrap: nowrap
    justify-content: flex-start
    align-items: flex-start
    align-content: flex-start
</style>
