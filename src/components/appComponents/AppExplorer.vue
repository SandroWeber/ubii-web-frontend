<template>
  <tree :data="treeData">

  </tree>  
</template>

<script>
  import LiquorTree from 'liquor-tree';


  export default {
    name: 'AppExplorer',
    components:{
      Tree: LiquorTree,
    },
    props: [
      "treeData",
    ],
    computed: {
      localValue: {
        get() {
          return this.value
        },
        set(localValue) {
          this.$emit('input', localValue)
        }
      }
    },
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
