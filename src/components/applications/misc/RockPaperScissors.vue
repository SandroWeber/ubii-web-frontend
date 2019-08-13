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
                    <div style="font-size: 1.5rem"><b>{{winLoseMsg}}</b></div>
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
      this.stop();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stop();
      this.start();
    });
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stop);

    if (UbiiClientService.isConnected) this.start();
  },
  beforeDestroy: function() {
    this.stop();
  },
  data: () => {
    return {
        //current inputs
        currentButtonInput: undefined,  //button
        gestureInputCollection: [],    //myo
        pollingInterval: null,

        //final gestures
        playerGesture: 0,
        opponentGesture: 0, 
        
        //ui related
        msgText: "temp",
        winLoseMsg: "win / lose message",


        ubiiClientService: UbiiClientService,
    };
  },
  methods: {
    createUbiiSpecs: function() {
      // create specifications for the protobuf messages

      // helper definitions that we can reference later
      let deviceName = 'rock-paper-scissors-game-device';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
      let outputServerPointer = {
        internalName: 'gestureId',
        messageFormat: 'ubii.dataStructure.float', //TODO: look up propper data structure
        topic: topicPrefix + '/' + 'gesture_id'
      };

      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: outputServerPointer.topic,
            messageFormat: outputServerPointer.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };
      //needed topic is like:
      //let topicName = UbiiClientService.getClientID() + '/web-interface-myo/myo_server_data'

      let processCB = () => {var tmp = "processCB-temp"};
      let onCreatedCB = () => {var tmp = "onCreatedCB-temp"};

      let ubiiInteraction = {
        id: uuidv4(),
        name: 'rock-paper-scissors-game-interaction',
        outputFormats: [
          {
            internalName: outputServerPointer.internalName,
            messageFormat: outputServerPointer.messageFormat
          }
        ],
        onCreated: onCreatedCB,
        processingCallback: processCB.toString()
      };

      // specification of a ubii.sessions.Session
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      let ubiiSession = {
        id: uuidv4(),
        name: 'web-mouse-example-session',
        interactions: [ubiiInteraction],
        ioMappings: [
          {
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
      this.$data.outputServerPointer = outputServerPointer;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiInteraction = ubiiInteraction;

      this.$data.ubiiSession = ubiiSession;
    },
    start: function() {
      UbiiClientService.isConnected().then(() => {

        //prepare ui - xxx          
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
            UbiiClientService.client.subscribe();

            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(response => {
                console.info(response);
              });
          });
      });
    },
    stop: function() {

      // unsubscribe and stop session
      UbiiClientService.client.unsubscribe();
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
        session: this.$data.ubiiSession
      });
    },
    updateMyoDevices: function() {
      UbiiClientService.client
        .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
        .then(reply => {
          this.$data.topicList = reply.stringList.list;

          this.$data.topicList.forEach(topic => {
            const topicIndex = topic.indexOf('/web-interface-myo/');

            if (topicIndex !== -1) {
              const clientID = topic.substring(0, topicIndex);

              // create new client if we dont have one yet or a new client just connected

              if (!this.$data.client) {
                this.createClient(clientID);
              } else {
                if (!this.$data.oldClients.includes(clientID)) {
                  this.createClient(clientID);
                }
              }
            }
          });
        });
    },
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++ game logic ++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
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
        } else {

            console.error("Invalid playerId:" + playerId);
        }
    },
    chooseGestureForOpponent: function() {
        var gestureId = Math.round((Math.random() * 2) + 1);
        this.opponentGesture = gestureId;
        this.changeIcon("opponent", this.opponentGesture);
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

                        //no input
                        if((this.currentButtonInput == undefined || this.currentButtonInput == 0) &&
                          (this.gestureInputCollection.length == 0)){
                            this.$data.msgText = "No input detected :("
                            btn.style.display = "inline";
                            this.switchGameArea("text-area");
                        }
                        //evaluate game
                        else{
                          if(this.gestureInputCollection.length == 0)
                            this.playerGesture = this.currentButtonInput;
                          else
                            this.getBestGesture();
                          
                          this.chooseGestureForOpponent();
                          this.evaluateGame(this.playerGesture);
                          this.switchGameArea("game-area");
                        }
                        //disable input and reset vars
                        this.enableInput(false);
                        this.playerGesture = this.currentButtonInput = 0;
                        this.gestureInputCollection = [];
                    },2000);
                },1000);
            },1000);
        }, 1000);
    },
    evaluateGame: function(gesture) {
        if(
            (gesture == 1 && this.opponentGesture == 1) ||
            (gesture == 2 && this.opponentGesture == 2) ||
            (gesture == 3 && this.opponentGesture == 3)
        ){
            this.winLoseMsg = "Draw";
        }
        else if(
            (gesture == 1 && this.opponentGesture == 3) ||
            (gesture == 2 && this.opponentGesture == 1) ||
            (gesture == 3 && this.opponentGesture == 2)
        ){
            this.winLoseMsg = "You win!";
        }
        else if(
            (gesture == 1 && this.opponentGesture == 2) ||
            (gesture == 2 && this.opponentGesture == 3) ||
            (gesture == 3 && this.opponentGesture == 1)
        ){
            this.winLoseMsg = "You lose!";
        }
        else{
             console.error("Invalid gesture id. player: " + this.gesture + " opponent: " + this.opponentGesture);
        }
    },
    getButtonInput: function(id) {
        this.currentButtonInput = id;
        this.changeIcon("player", id);
    },
    enableInput: function(enable) {
        this.lockButtons(enable);

        //enable/disable gesture input collecting
        if(enable)
          this.pollingInterval = setInterval(() => this.getGestureData(), 100);
        else
          clearInterval(this.pollingInterval);

    },
    //enables/disables buttons for the game
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
    },
    //fills array with the id of the currently detected gesture
    getGestureData: function() {
      //TODO: get gesture data, this is just a dummy for testing

      /* var gestureId = Math.round((Math.random() * 2) + 1);
      this.gestureInputCollection.push(gestureId); */
    },
    //chooses a gesture from input array
    getBestGesture: function() {
      if(this.gestureInputCollection.length == 0)
        return;
      else {
        var cnt_1 = 0;
        var cnt_2 = 0;
        var cnt_3 = 0;

        //count gesture ids
        this.gestureInputCollection.forEach((element) => {
          switch(element){
            case 1: cnt_1++; break;
            case 2: cnt_2++; break;
            case 3: cnt_3++; break;
          }
        });

        if(cnt_1 == 0 && cnt_2 == 0 && cnt_3 == 0)
          return;
        
        //choose most frequent gesture
        else if(cnt_1 >= cnt_2 && cnt_1 >= cnt_3){
          this.playerGesture = 1;
        }
        else if(cnt_2 >= cnt_1 && cnt_2 >= cnt_3){
          this.playerGesture = 2;
        }
        else if(cnt_3 >= cnt_1 && cnt_3 >= cnt_2){
          this.playerGesture = 3;
        }
        this.changeIcon("player", this.playerGesture);
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
