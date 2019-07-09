<template>
    <UbiiClientContent :ubiiClientService="ubiiClientService">
        <div class="controller">
            <div>

            </div>
            <h1>Ubii Controller</h1>
            <button @click="clickActionButton(A)" class="action-button">Button A</button>



        </div>

        <!-- the interaction area.
        if our pointer is inside, its position is sent to the server and back to us, then displayed as a red square-->
        <!--<div id="mouse-pointer-area"
             class="mouse-pointer-area"
             v-bind:class="{ hideCursor: !showClientPointer }"
             v-on:mousemove="onMouseMove($event)"
             v-on:mouseenter="clientPointerInside = true;"
             v-on:mouseleave="clientPointerInside = false;"
             v-on:touchstart="onTouchStart($event)"
             v-on:touchend="clientPointerInside = false;"
             v-on:touchmove="onTouchMove($event)">
            <div class="server-mouse-position-indicator"
                 :style="{top: serverMousePosition.y + 'px', left: serverMousePosition.x + 'px' }"
                 v-show="showServerPointer && clientPointerInside"></div>
        </div>-->
    </UbiiClientContent>
</template>

<script>
   
    export default {
        name: "ExampleUbiiCon",
        components: {
            
        },
      
        //data: () => {
        //    return {
        //        showClientPointer: true,
        //        showServerPointer: true,
        //        mirrorPointer: false,
        //        ubiiClientService: UbiiClientService,
        //        exampleStarted: false,
        //        serverMousePosition: { x: 0, y: 0 },
        //        clientPointerInside: false
        //    };
        //},
        
    };
</script>

<style scoped lang="stylus">
    .controller {
        display:normal;
        color: aqua;
        text-align: center;
        margin-top: 10%;
        margin-left: 30%;
        height: 30%;
        width: 30%;
        position: center;
        border: groove;
    }

    .action-button{
        background: #808080;
        color: aquamarine;
        border: none;
        padding: 20px 20px;
        border-radius: 50%;
        cursor: pointer;
    }

    .options {
        margin: 25px;
    }

    .mouse-pointer-area {
        margin: 25px;
        border: 3px solid black;
        height: 100px;
    }

    .hideCursor {
        cursor: none;
    }

    .server-mouse-position-indicator {
        position: relative;
        width: 10px;
        height: 10px;
        background-color: red;
    }

    .start-example {
        text-align: center;
        margin-top: 25px;
    }

    .start-example-button {
        width: 50px;
        height: 50px;
    }
</style>
