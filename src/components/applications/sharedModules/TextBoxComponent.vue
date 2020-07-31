<template xmlns="http://www.w3.org/1999/html">
    <p class="settings-canvas">
        <label for="url-input">Enter the desired URL:</label>
        <input class="textbox-component" id="url-input" type="url" v-model="this.$props.url" placeholder="Enter a new URL">
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
    .settings-canvas{
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: nowrap;
    }
</style>