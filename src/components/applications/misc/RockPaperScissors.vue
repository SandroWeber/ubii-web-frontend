<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <link rel="stylesheet" href="https://unpkg.com/purecss@1.0.1/build/pure-min.css" integrity="sha384-oAOxQR6DkCoMliIh8yFnu25d7Eq/PHS21PClpwjOTeU2jRSq11vu66rf90/cZr47" crossorigin="anonymous">
    <div class="top-div">
        <br> 
        <div class="c">
            <div class="box-area"> <!-- style="font-size: 1.5rem"> -->
               <div id="game-area">
                    <div>Opponent</div>
                    <br>
                    <div class="bigger-icon">
                        <font-awesome-icon id="opponent-scissors-icon" icon="hand-scissors" class="interface-icon"/>     
                        <font-awesome-icon id="opponent-rock-icon" icon="hand-rock" class="interface-icon"/>  
                        <font-awesome-icon id="opponent-paper-icon" icon="hand-paper" class="interface-icon"/>     
                    </div>
                    <br>
                    <br>
                    <div>Player</div>
                    <br>
                    <div class="bigger-icon">
                        <font-awesome-icon id="player-scissors-icon" icon="hand-scissors" class="interface-icon"/>     
                        <font-awesome-icon id="player-rock-icon" icon="hand-rock" class="interface-icon"/>     
                        <font-awesome-icon id="player-paper-icon" icon="hand-paper" class="interface-icon"/>     
                    </div>
                    <br>
                    <br>
                    <div style="font-size: 1.5rem"><b>{{winLooseMsg}}</b></div>
                    <br>
                    <br>
                    <button class="pure-button"  @click="startGame()">Retry</button>
                </div>
                <div class="in-the-middle" id="text-area">
                    <div id="message-text">{{msgText}}</div>
                    <br>
                    <button class="pure-button" id="optional-retry-btn" @click="startGame()">Retry</button>
                </div>
                <div class="in-the-middle" id="ready-area">
                    <button class="pure-button"  @click="startGame()">Ready</button>
                </div>
            </div>
            <br>
            <div class="pure-button-group" role="group" aria-label="...">
                <button class="pure-button" id="rock-btn" @click='getButtonInput(2)'>
                    <font-awesome-icon icon="hand-rock" class="interface-icon"/>
                </button>
                <button class="pure-button" id="paper-btn" @click='getButtonInput(3)'>
                    <font-awesome-icon icon="hand-paper" class="interface-icon"/>
                </button>
                <button class="pure-button" id="scissors-btn" @click='getButtonInput(1)'>
                    <font-awesome-icon icon="hand-scissors" class="interface-icon"/>
                </button>
            </div>
        </div>
    </div>
  </UbiiClientContent>
</template>

<script>
import UbiiClientContent from '../sharedModules/UbiiClientContent';
import UbiiEventBus from '../../../services/ubiiClient/ubiiEventBus';

import uuidv4 from 'uuid/v4';
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import { mapActions } from 'vuex';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
    faHandRock,
    faHandPaper,
    faHandScissors
} from '@fortawesome/free-solid-svg-icons';
import { setTimeout } from 'timers';

library.add(faHandRock);
library.add(faHandPaper);
library.add(faHandScissors);

/* eslint-disable no-console */

export default {
  name: 'RockPaperScissors',
  components: { UbiiClientContent },
  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopExample();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stopExample();
      this.startExample();
    });
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stopExample);

    if (UbiiClientService.isConnected) this.startExample();
  },
  beforeDestroy: function() {
    this.stopExample();
  },
  data: () => {
    return {
        playMode: 0,
        curntInput: undefined,
        playerGesture: 0,
        opponentGesture: 0,
        msgText: "temp",
        winLooseMsg: "win / loose message",
        myoCOnnected: false,

        
        showClientPointer: true,
        showServerPointer: true,
        mirrorPointer: false,
        ubiiClientService: UbiiClientService,
        exampleStarted: false,
        serverMousePosition: { x: 0, y: 0 },
        clientPointerInside: false
    };
  },
  watch: {
    mirrorPointer: function(value) {
      if (
        !UbiiClientService.isConnected ||
        !this.$data.ubiiDevice.name ||
        !this.$data.inputMirror.topic
      ) {
        return;
      }

      // if the checkbox is changed, we publish this info on the related topic
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputMirror.topic,
        this.$data.inputMirror.messageFormat,
        value
      );
    }
  },
  methods: {
    createUbiiSpecs: function() {
      // create specifications for the protobuf messages

      // helper definitions that we can reference later
      let deviceName = 'web-example-mouse-pointer';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
      let inputClientPointer = {
        internalName: 'clientPointer',
        messageFormat: 'ubii.dataStructure.Vector2',
        topic: topicPrefix + '/' + 'mouse_client_position'
      };
      let inputMirror = {
        internalName: 'mirrorPointer',
        messageFormat: 'bool',
        topic: topicPrefix + '/' + 'mirror_mouse'
      };
      let outputServerPointer = {
        internalName: 'serverPointer',
        messageFormat: 'ubii.dataStructure.Vector2',
        topic: topicPrefix + '/' + 'mouse_server_position'
      };

      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: inputClientPointer.topic,
            messageFormat: inputClientPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: inputMirror.topic,
            messageFormat: inputMirror.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: outputServerPointer.topic,
            messageFormat: outputServerPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };

      // specification of a ubii.interactions.Interaction
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/interactions/interaction.proto
      let processingCallback = (input, output) => {
        if (!input.clientPointer) {
          return;
        }

        if (input.mirrorPointer === true) {
          output.serverPointer = {
            x: 1 - input.clientPointer.x,
            y: 1 - input.clientPointer.y
          };
        } else {
          output.serverPointer = {
            x: input.clientPointer.x,
            y: input.clientPointer.y
          };
        }
      };

      let ubiiInteraction = {
        id: uuidv4(),
        name: 'mirror-mouse-pointer',
        processingCallback: processingCallback.toString(),
        inputFormats: [
          {
            internalName: inputClientPointer.internalName,
            messageFormat: inputClientPointer.messageFormat
          },
          {
            internalName: inputMirror.internalName,
            messageFormat: inputMirror.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: outputServerPointer.internalName,
            messageFormat: outputServerPointer.messageFormat
          }
        ]
      };

      // specification of a ubii.sessions.Session
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      let ubiiSession = {
        id: uuidv4(),
        name: 'web-mouse-example-session',
        interactions: [ubiiInteraction],
        ioMappings: [
          {
            interactionId: ubiiInteraction.id,
            inputMappings: [
              {
                name: inputClientPointer.internalName,
                topicSource: inputClientPointer.topic
              },
              {
                name: inputMirror.internalName,
                topicSource: inputMirror.topic
              }
            ],
            outputMappings: [
              {
                name: outputServerPointer.internalName,
                topicDestination: outputServerPointer.topic
              }
            ]
          }
        ]
      };

      // assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.inputClientPointer = inputClientPointer;
      this.$data.inputMirror = inputMirror;
      this.$data.outputServerPointer = outputServerPointer;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiInteraction = ubiiInteraction;

      this.$data.ubiiSession = ubiiSession;
    },
    startExample: function() {
      UbiiClientService.isConnected().then(() => {

        //prepare ui - xxx
        
/*         var player_icon_1 = document.getElementById("player-rock-icon");
        player_icon_1.style.display = "none";
        var player_icon_2 = document.getElementById("player-paper-icon");
        player_icon_2.style.display = "none";
        var opponent_icon_1 = document.getElementById("opponent-rock-icon");
        opponent_icon_1.style.display = "none";
        var opponent_icon_2 = document.getElementById("opponent-paper-icon");
        opponent_icon_2.style.display = "none"; */
        
        this.switchGameArea("ready-area");
        this.enableInput(false);
        
        // create all the specifications we need to define our example application
        // these are protobuf messages to be sent to the server (saved in this.$data)
        this.createUbiiSpecs();

        // register the mouse pointer device
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then(device => {
            // on success, the response will be the (possibly extended) device specification we just sent
            // we accept any additions the server might have made, like an ID that was left blank so the backend
            // would automatically assign one, to our local state
            this.$data.ubiiDevice = device;
            return device;
          })
          .then(() => {
            // subscribe to the device topics so we are notified when new data arrives on the topic
            UbiiClientService.client.subscribe(
              this.$data.outputServerPointer.topic,
              // a callback to be called when new data on this topic arrives
              mousePosition => {
                // when we get a normalized server pointer position, we calculate back to absolute (x,y) within the
                // interaction area and set our red square indicator
                let boundingRect = document
                  .getElementById('box-area')
                  .getBoundingClientRect();
                this.$data.serverMousePosition = {
                  x: mousePosition.x * boundingRect.width,
                  y: mousePosition.y * boundingRect.height
                };
              }
            );

            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(response => {
                console.info(response);
                this.$data.exampleStarted = true;
              });
          });
      });
    },
    stopExample: function() {
      if (!this.exampleStarted) return;

      this.exampleStarted = false;

      // unsubscribe and stop session
      UbiiClientService.client.unsubscribe(
        this.$data.outputServerPointer.topic
      );
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });
    },
    onMouseMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current mouse position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let boundingRect = event.currentTarget.getBoundingClientRect();
      let relativeMousePosition = {
        x: event.offsetX / boundingRect.width,
        y: event.offsetY / boundingRect.height
      };

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client mouse position
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputClientPointer.topic,
        'vector2',
        this.$data.clientMousePosition
      );
    },
    onTouchStart: function(event) {
      this.$data.clientPointerInside = true;
      this.onTouchMove(event);
    },
    onTouchMove: function(event) {
      if (!this.exampleStarted) {
        return;
      }

      // calculate the current touch position, normalized to the bounds of the interactive area ([0;1], [0;1])
      let relativeMousePosition = {
        x:
          (event.touches[0].clientX - event.target.offsetLeft) /
          event.target.offsetWidth,
        y:
          (event.touches[0].clientY - event.target.offsetTop) /
          event.target.offsetHeight
      };

      if (
        relativeMousePosition.x < 0 ||
        relativeMousePosition.x > 1 ||
        relativeMousePosition.y < 0 ||
        relativeMousePosition.y > 1
      ) {
        this.$data.clientPointerInside = false;
        return;
      }

      this.$data.clientMousePosition = relativeMousePosition;
      // publish our normalized client touch position
      UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputClientPointer.topic,
        'vector2',
        this.$data.clientMousePosition
      );
    },
    ...mapActions('interactions', {
      addInteraction: 'add'
    }),
    toggleGame: function() {
        var game_area = document.getElementById("game-area");
        var msg_area = document.getElementById("text-area");

        if(game_area.style.display == "none"){
            game_area.style.display = "block";
            msg_area.style.display = "none";
        } else {
            game_area.style.display = "none";
            msg_area.style.display = "block";
        }

        //this.chooseGestureForOpponent();
    },
    switchGameArea: function(id){
        var game_area = document.getElementById("game-area");
        var txt_area = document.getElementById("text-area");
        var rdy_area = document.getElementById("ready-area");

        switch(id){
            case "game-area":
                game_area.style.display = "block";
                txt_area.style.display = "none";
                rdy_area.style.display = "none";
                break;
            case "text-area":
                game_area.style.display = "none";
                txt_area.style.display = "block";
                rdy_area.style.display = "none";
                break;
            case "ready-area":
                game_area.style.display = "none";
                txt_area.style.display = "none";
                rdy_area.style.display = "block";
                break;
            default:
                console.error("Invalid area id: " + id);
        }

        //this.chooseGestureForOpponent();
    },
    changeIcon: function(playerId, iconId) {
        if(playerId == "player"){

            var player_icon_1 = document.getElementById("player-scissors-icon");
            player_icon_1.style.display = "none";
            var player_icon_2 = document.getElementById("player-rock-icon");
            player_icon_2.style.display = "none";
            var player_icon_3 = document.getElementById("player-paper-icon");
            player_icon_3.style.display = "none";
            switch(iconId){
                case 1: player_icon_1.style.display = "inline"; break;
                case 2: player_icon_2.style.display = "inline"; break;
                case 3: player_icon_3.style.display = "inline"; break;
                default: console.error("Invalid iconId: " + iconId);
            }
            console.log("player, icon: "+ iconId);

        } else if(playerId == "opponent"){
            
            var opponent_icon_1 = document.getElementById("opponent-scissors-icon");
            opponent_icon_1.style.display = "none";
            var opponent_icon_2 = document.getElementById("opponent-rock-icon");
            opponent_icon_2.style.display = "none";
            var opponent_icon_3 = document.getElementById("opponent-paper-icon");
            opponent_icon_3.style.display = "none";
            switch(iconId){
                case 1: opponent_icon_1.style.display = "inline"; break;
                case 2: opponent_icon_2.style.display = "inline"; break;
                case 3: opponent_icon_3.style.display = "inline"; break;
                default: console.error("Invalid iconId: " + iconId);
            }
            console.log("opponent, icon: "+ iconId);

        } else {

            console.error("Invalid playerId:" + playerId);
        }
    },
    chooseGestureForOpponent: function() {
        var gestureId = Math.round((Math.random() * 2) + 1);
        this.opponentGesture = gestureId;
        this.changeIcon("opponent", this.opponentGesture);
        //console.log(gestureId);
    },
    startGame: function() {
        
        var btn = document.getElementById("optional-retry-btn");
        btn.style.display = "none";

        this.$data.msgText = "3";
        this.switchGameArea("text-area");

        setTimeout(() => {
            this.$data.msgText = "2";
            setTimeout(() => {
                this.$data.msgText = "1";
                setTimeout(() => {
                    this.$data.msgText = "GO!";
                    this.enableInput(true);
                    setTimeout(() => {

                        if(this.curntInput == undefined || this.curntInput == 0){
                            this.$data.msgText = "No input detected :("
                            btn.style.display = "inline";
                            this.switchGameArea("text-area");
                        }else{
                            this.chooseGestureForOpponent();
                            this.playerGesture = this.curntInput;
                            this.evaluateGame();
                            this.switchGameArea("game-area");
                        }
                        this.enableInput(false);
                        this.playerGesture = this.curntInput = 0;
                    },2000);
                },1000);
            },1000);
        }, 1000);
    },
    evaluateGame: function() {
        if(
            (this.playerGesture == 1 && this.opponentGesture == 1) ||
            (this.playerGesture == 2 && this.opponentGesture == 2) ||
            (this.playerGesture == 3 && this.opponentGesture == 3)
        ){
            console.log("player: " + this.playerGesture + " opponent: " + this.opponentGesture);
            this.winLooseMsg = "Draw";
        }
        else if(
            (this.playerGesture == 1 && this.opponentGesture == 3) ||
            (this.playerGesture == 2 && this.opponentGesture == 1) ||
            (this.playerGesture == 3 && this.opponentGesture == 2)
        ){
            console.log("player: " + this.playerGesture + " opponent: " + this.opponentGesture);
            this.winLooseMsg = "You win!";
        }
        else if(
            (this.playerGesture == 1 && this.opponentGesture == 2) ||
            (this.playerGesture == 2 && this.opponentGesture == 3) ||
            (this.playerGesture == 3 && this.opponentGesture == 1)
        ){
            console.log("player: " + this.playerGesture + " opponent: " + this.opponentGesture);
            this.winLooseMsg = "You loose!";
        }
        else{
             console.error("Invalid gesture id. player: " + this.playerGesture + " opponent: " + this.opponentGesture);
        }
    },
    getButtonInput: function(id) {
        this.curntInput = id;
        this.changeIcon("player", id);
    },
    enableInput: function(enable) {
        this.lockButtons(enable);
        //TODO: handle myo input
    },
    lockButtons: function(enable) {
        var scissor_btn = document.getElementById("scissors-btn");
        if(scissor_btn == null) console.error("scissor btn faulty");
        var rock_btn = document.getElementById("rock-btn");
        if(rock_btn == null) console.error("rock btn faulty");
        var paper_btn = document.getElementById("paper-btn");
        if(paper_btn == null) console.error("paper btn faulty");

        if(enable){
            scissor_btn.className = "pure-button";
            rock_btn.className = "pure-button";
            paper_btn.className = "pure-button";
        } else {
            scissor_btn.className = "pure-button pure-button-disabled";
            rock_btn.className = "pure-button pure-button-disabled";
            paper_btn.className = "pure-button pure-button-disabled";
        }
    }
  }
};
</script>

<style scoped lang="stylus">
div.c {
  text-align: center;
}

.box-area {
    padding-top: 30px;
    padding-bottom: 50px;
    margin: 50px;
    border: 3px #B6B5AA;
    height: 400px;
    background-color: #403e41;
}

.bigger-icon {
    font-size: 250%;
}

.in-the-middle {
    padding-top: 140px;
}

.myButton {
    color: white;
    border-radius: 4px;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    background: rgb(223, 117, 20); /* this is an orange */
}   
</style>
