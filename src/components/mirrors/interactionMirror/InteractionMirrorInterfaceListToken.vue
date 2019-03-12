<template>
  <div class="interaction-mirror-interface-list-token">
    <app-token :text="name">
    </app-token>
  </div>
</template>

<script>
import AppToken from './../../appComponents/AppToken.vue';

  export default { 
    name: 'InteractionMirrorInterfaceListToken',
    components: {
      AppToken: AppToken
    },
    props: {
      name: String,
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list-token
    order 1
    margin 5px
</style>
