<template>
  <div class="canvas layer-two background horizontal-shadow">
    <div class="grid">
      <router-link  to="/admin"
                    class="interface-link layer-three background round shadow link-area green-accent">
        <font-awesome-icon  icon="cogs"
                            class="interface-icon" />
        <p>Administration</p>
      </router-link>

      <router-link  to="/tools"
                    class="interface-link layer-three background round shadow link-area blue-accent">
        <font-awesome-icon  icon="toolbox"
                            class="interface-icon " />
        <p>Tools</p>
      </router-link>
    </div>
  </div> 
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faCogs, faToolbox } from '@fortawesome/free-solid-svg-icons'

  library.add(faCogs);
  library.add(faToolbox);

  export default {
    name: 'EntryPage',
    components: {} 
  }
</script>

<style scoped lang="stylus">
  .canvas
    height: 100% 
    padding: 25px
  
  .grid
    display: grid
    grid-gap: 15px
    grid-template-columns: 1fr 1fr 1fr 1fr

  .interface-link
    padding: 10px
    text-align: center


  .interface-icon
    width: 50px
    height: 50px
</style>
