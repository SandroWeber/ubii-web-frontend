<template xmlns="http://www.w3.org/1999/html">
    <p class="settings-canvas">
        <label for="url-input">Enter the desired URL:</label>
        <input class="url-textbox" id="url-input" type="url" v-bind:value=this.$data.urlObject.url @input=onInput>
        <button class="reload-button" v-on:click=this.$props.onReload>Reload</button>
    </p>
</template>

<script>
  export default {
    name: 'TextBoxComponent',
    props: ['onReload'],
    data(){
      return {urlObject:{url:undefined}};
    },
    methods:{
      onInput: function (e) {
        this.$data.urlObject.url = e.target.value;
      }
    }
  }
</script>

<style scoped>
    .url-textbox{
        height: 20px;
        width: 300px;
    }
    .settings-canvas{
        padding-top: 20px;
        display: flex;
        flex-direction: row;
        justify-content: center;
    }
    .reload-button{
        padding-left: 5px;
    }
</style>