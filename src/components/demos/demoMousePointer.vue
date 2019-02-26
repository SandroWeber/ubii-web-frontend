<template>
  <div class="grid">
    <div class="options">

      <input  id="checkboxClientPointer"
              type="checkbox"
              v-model="showClientPointer" />
      <label for="checkboxClientPointer">
        Show Client Pointer
      </label>

      <br/>

      <input  id="checkboxServerPointer"
              type="checkbox"
              v-model="showServerPointer" />
      <label for="checkboxServerPointer">
        Show Server Pointer
      </label>
      
    </div>
    <div  class="mouse-pointer-area"
          v-bind:class="{ hideCursor: !showClientPointer }">
    </div>
  </div>
</template>

<script>
  export default {
    name: 'DemoMousePointer',
    data: () => {
      return {
        showClientPointer: true,
        showServerPointer: true
      }
    }
  }
</script>

<style scoped lang="stylus">
  .grid
    display: grid
    grid-gap: 15px
    grid-template-columns: 1fr 5fr
    margin: 25px

  .mouse-pointer-area
    margin: 25px
    border: 3px solid black
    height: 500px

  .hideCursor
    cursor: none
</style>
