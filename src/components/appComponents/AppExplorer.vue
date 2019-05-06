<template>
  <tree  :options="treeOptions">

  </tree>  
</template>

<script>
  import LiquorTree from 'liquor-tree';

  export default {
    name: 'AppExplorer',
    components:{
      Tree: LiquorTree,
    },
    props: {
      treeData: Array,
    },
    computed: {
      treeOptions () {
        let that = this;
        return {
          store: {
            store: this.$store,
            getter: () => {
              return this.$store.getters['interactions/tree']
            },
            dispatcher(tree) {
              that.$store.dispatch('interactions/updateTree', tree)
            }
          },
          checkbox: true
        }
      }
    },
  }
</script>

<style scoped lang="stylus">
@import "./../../styles/main/color"
</style>
