<template>
  <div
    class="node-mirror layer-three background shadow">
    <div
      class="blueprint-grid">
        <svg
          width="100%"
          height="100%">
            <defs>
                <pattern
                  id="dots"
                  x="0"
                  y="0"
                  width="25"
                  height="25"
                  patternUnits="userSpaceOnUse">
                    <circle
                      class="blueprint-dot"
                      cx="10.5"
                      cy="10.5"
                      r="1.5"/>
                </pattern>
            </defs>
            <rect 
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#dots)"/>
        </svg>
    </div>
    <div
      id="viewer"
      ref="viewer" >
    </div>
  </div>
</template>

<script>  
  import initViewer from './viewer';

  export default {  
    name: 'nodeMirror',  
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

<style scoped lang="stylus"> 
  .node-mirror
    position relative
    width: 100%
    height: 100%

  .blueprint-grid
    position absolute
    top 0
    width: 100%
    height: 100%

  .blueprint-dot
    fill: lowContrastColor

  #viewer
    position relative
    width 100%
    height 1000px
</style>
