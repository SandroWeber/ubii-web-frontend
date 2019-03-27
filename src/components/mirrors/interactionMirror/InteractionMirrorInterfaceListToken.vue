<template>
  <div
    class="interaction-mirror-interface-list-token"
  >
    <app-token
      :class="computedClassList"
      :text="name"
    >
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
      interfaceKey: String,
      code: String
    },
    computed: {
      isUnused: function(){
        return (this.code.includes(this.interfaceKey+"."+this.name) !== true);
      },
      computedClassList: function(){
        return {
          "orange-accent": this.isUnused
        }
      }
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list-token
    order 1
    margin 5px
</style>
