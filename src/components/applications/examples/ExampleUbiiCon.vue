<template>
    <UbiiClientContent :ubiiClientService="ubiiClientService">
        <div class="controller">
            <h1>Ubii Controller</h1>
            <div>
                <button @click="clickActionButton(1)" class="action-button">Button A</button>
                <button @click="clickActionButton(2)" class="action-button">Button B</button>
            </div>
        <div>
            <button @click="startExample()" class="start-button">Start</button>
        </div>


        </div>
    </UbiiClientContent>
</template>

<script>
    //import UbiiClientContent from "../sharedModules/UbiiClientContent";
    //import { DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";
    import UbiiClientService from "../../../services/ubiiClient/ubiiClientService";
    //import UbiiEventBus from "../../../services/ubiiClient/ubiiEventBus";
    export default {
        name: "ExampleUbiiCon",
        components: {

        },
        methods: {
            startExample: function () {
                UbiiClientService.isConnected().then(() => {
                    this.registerController();
                });
            }, 
            stopExample: function () {
                // Quit
            },
            registerController: function(){
                    // Publish(UbiiParser.UnityToProto("registerNewClient", GetID()));
            },
            clickedActionButton: function(buttonID){
                return buttonID;
                //Publish(UbiiParser.UnityToProto("playerInput" + GetID(), buttonID));
            }
        }

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
        display: normal;
        color: aqua;
        text-align: center;
        margin-top: 10%;
        margin-left: 30%;
        height: 30%;
        width: 30%;
        position: center;
        border: groove;
    }

    .virtual-joystick{
        background: #808080;
        color: aquamarine;
        border: none;
        padding: 20px 20px;
    }

    .action-button {
        background: #808080;
        color: aquamarine;
        border: none;
        padding: 20px 20px;
        border-radius: 50%;
        cursor: pointer;
        margin-left: 50%;
        margin-top : 5%;
    }

    .start-button {
        background: #808080;
        color: aquamarine;
        border: none;
        padding: 5px 5px;
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
