<template>
  <div class="interaction-mirror-interface-list-token token" :class="computedClassList">
    <span>
      {{name}}
    </span>
  </div>
</template>

<script>
  export default { 
    name: 'InteractionMirrorInterfaceListToken',
    components: {},
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
    padding 5px 10px 5px 10px
</style>
