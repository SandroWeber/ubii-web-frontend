<template>
  <div class="node-canvas layer-three background shadow">
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
</template>

<script>
  export default { 
    name: 'nodeCanvas',
    components: {} 
  } 
</script> 

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus"> 
  .node-canvas { 
    width: 100%; 
    height: 100%;  
  } 
  .blueprint-grid {
    width: 100%;
    height: 100%;
  }
  .blueprint-dot {
    fill: lowContrastColor
  }
</style>
