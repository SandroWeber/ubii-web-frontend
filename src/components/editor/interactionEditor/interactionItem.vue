<template>
  <div class="interaction-item low-contrast" @click="selectItem(id)">
        <span>{{name}}</span>
  </div>
</template>

<script>
  export default { 
    name: 'interactionInterfaceToken',
    components: {},
    props: {
        id: String,
        name: String,
    },
    methods: {
        selectItem: function(id) {
            this.$emit('select', id);
        }
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-item
    order 1
    margin 5px
    padding 5px 10px 5px 10px
</style>
