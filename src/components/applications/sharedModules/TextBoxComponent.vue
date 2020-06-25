<template>
    <p>
    <input class="textbox-component" type="url" v-model="url" placeholder="Enter a new URL">
    {{url}}
    </p>
</template>

<script>
  export default {
    name: 'TextBoxComponent'
  }
</script>

<style scoped>
    .textbox-component{
        top: 100px;
        left: 20px;
        height: 20px;
        width: 300px;
        z-index: 100;
        color: red;
    }
</style>