<template>
  <div class="node-canvas layer-three background shadow">
      

    <div id="viewer" ref="viewer" >
      <div class="blueprint-grid">
        <svg width="100%" height="100%">
            <defs>
                <pattern id="dots" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                    <circle class="blueprint-dot" cx="10.5" cy="10.5" r="1.5" />
                </pattern>
            </defs>

            <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
        </svg>
    </div>
    </div>
  </div>
</template>

<script>  
  import initViewer from './viewer';
  

  export default {  
    name: 'nodeCanvas',  
    data: () => {
        return {
        };
      },
    components: {},
    async mounted(){
      await initViewer(this.$refs.viewer);
    }
  }
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus"> 
  .node-canvas { 
    position relative
    width: 100%; 
    height: 100%;  
  } 
  .blueprint-grid {
    position absolute
    top 0
    width: 100%;
    height: 100%;
  }
  .blueprint-dot {
    fill: lowContrastColor
  }
  #viewer{
    position relative
    width 100%
    height 1000px
  }
</style>
