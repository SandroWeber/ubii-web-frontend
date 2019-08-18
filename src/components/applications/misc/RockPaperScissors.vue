<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <link rel="stylesheet" href="https://unpkg.com/purecss@1.0.1/build/pure-min.css" integrity="sha384-oAOxQR6DkCoMliIh8yFnu25d7Eq/PHS21PClpwjOTeU2jRSq11vu66rf90/cZr47" crossorigin="anonymous">
    <div class="top-div">
        <br> 
        <div class="c">
<!--           <div>Debug: {{emgData}}</div>
          <br>
          <button class="pure-button"  @click="printEmgBuffer()">Print emg buffer</button>
          <br>
          <br> -->
          <input id="checkboxInput" type="checkbox" v-model="useGestureInput" />
          <label for="checkboxInput">Myo Gesture Input</label>
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
      this.stopSession();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stopSession();
      this.startSession();
    });
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stopSession);

    if (UbiiClientService.isConnected) this.startSession();
  },
  beforeDestroy: function() {
    this.stopSession();
  },
  data: () => {
    return {
        //current inputs
        currentButtonInput: undefined,  //button
        gestureInputCollection: [],     //myo

        //final gestures
        playerGesture: 0,
        opponentGesture: 0, 
        
        //ui related
        msgText: "temp",
        winLoseMsg: "win / lose message",

        //game related
        useGestureInput: true,
        collectGestureData: false,

        //ubi-related
        ubiiClientService: UbiiClientService,
        client: undefined,
        oldClients:[],
        publishInterval: null,
        pollingInterval: null,

        //myo
        emgData: {v0:0,v1:0,v2:0,v3:0,v4:0,v5:0,v6:0,v7:0},
        emgBuffer: [],
        emgProtoElements: undefined
    };
  },
  methods: {
    createUbiiSpecs: function() {
      // create specifications for the protobuf messages

      // helper definitions that we can reference later
      let deviceName = 'rock-paper-scissors-game-device';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
      let inputEmgData = {
        internalName: 'emgData',
        messageFormat: 'ubii.dataStructure.Int32List',
        topic: topicPrefix + '/' + 'emg_data'
      };
      let outputGestureData = {
        internalName: 'gestureId',
        messageFormat: 'ubii.dataStructure.Int32', 
        topic: topicPrefix + '/' + 'gesture_id'
      };

      // specification of a ubii.devices.Device
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: inputEmgData.topic,
            messageFormat: inputEmgData.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
          },
          {
            topic: outputGestureData.topic,
            messageFormat: outputGestureData.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.OUTPUT
          }
        ]
      };
      //prints received empty data
      let processCBNull = (input, output, state) => {
            if(input.emgData && input.emgData.elements.length == 64 && state.model){
              output.gestureId = 0;
            }
        };

      //this works
      let processCBDummy = (input, output, state) => {
            if(input.emgData && input.emgData.elements.length == 64 && state.model){
              output.gestureId = Math.round((Math.random() * 2) + 1);
            }
        };

      //this works
      let processCBMinimal =
      '(input, output, state) => {'+
        'if(input.emgData && input.emgData.elements.length == 64 && state.model){'+
          'output.gestureId = 3'+
        '};'+
      '};'

      //this works
      let processCBAsync =
      '(input, output, state) => {'+
        'if(input.emgData && input.emgData.elements.length == 64 && state.model){'+
          'let predict = async () => {'+
          'return 1;'+
          '};'+
          'predict().then(prediction => {'+
          'output.gestureId = prediction'+
          '});'+
        '};'+
      '};'
      
      //this works

      //output prediction:
      /* Tensor {
        kept: false,
        isDisposedInternal: false,
        shape: [ 1 ],
        dtype: 'int32',
        size: 1,
        strides: [],
        dataId: {},
        id: 2050053,
        rankType: '1',
        scopeId: 1369890 } */

      //output prediction.print()
      /* Tensor
          [0]     //  value between 0-5
        undefined */
      let processCBModel =
      '(input, output, state) => {'+
        'if(input.emgData && input.emgData.elements.length == 64 && state.model){'+
          'let predict = async () => {'+
          'let tensor = state.modules.tf.tensor2d(input.emgData.elements, [1,64]);'+
          'let prediction = await state.model.predict(tensor);'+
          //'console.log(prediction);'+
          //'console.log(prediction.print());'+
          //'console.log("--------");'+
          'return 1;'+
          '};'+
          'predict().then(prediction => {'+
          'output.gestureId = prediction'+
          '});'+
        '};'+
      '};'
      
      //this works
      let processCB =
      '(input, output, state) => {'+
        'if(input.emgData && input.emgData.elements.length == 64 && state.model){'+
          'let predict = async () => {'+
          'let tensor = state.modules.tf.tensor2d(input.emgData.elements, [1,64]);'+
          'let prediction = await state.model.predict(tensor);'+
          'return prediction;'+
          '};'+
          'predict().then(prediction => {'+
            //'console.log("+++++++++++++++++++++++++++++++++++++");'+
            'let getData = async () => {'+
                'let data = await prediction.data();'+
                //'let data = await prediction.asType("int32");'+
                'dataConv = parseInt(data.toString());'+
                //'data = parseInt(data);'+
                //'console.log(typeof data);'+
                //'console.log(data);'+
                //'console.log(parseInt(data, 10));'+
                'if(!dataConv) {'+
                  'dataConv = 0;'+
                  //'console.log("empty: "+ data);'+
                  '}'+
              	'return dataConv;'+
            '};'+
            'getData().then(data => {'+
              'output.gestureId = data;'+
            '});'+
          '});'+
        '};'+
      '};'
      
      let processCBold = 
        '(inputs, outputs, state) => {'+
        'if (input.emgData && input.emgData.elements.length == 64 && state.model) {'+
        '// prediction function'+
        'let predict = async () => {'+
        '//console.info("predicting");'+
        '//let tensor = state.modules.tf.tensor2d(input.emgData.elements, [64,1]);'+
        '//let prediction = await state.model.predict(imgTensor);'+
        'return 3; //prediction;'+
        '};'+
        '// make predictions'+
        'predict().then(prediction => {'+
        '//console.info(prediction);'+
        'output.gestureId = prediction;'+
        '});'+
        '}'+
        '};';

      let processCBTest = 
       (input, output, state) => {
          if (input.emgData && input.emgData.elements.length == 64 && state.model) {
          // prediction function
            let predict = async () => {

            //'console.info("predicting");
            let tensor = state.modules.tf.tensor2d(input.emgData.elements, [64,1]);
            
            let prediction = await state.model.predict(tensor);

            return prediction;
            };
            // make predictions
            predict().then(prediction => {
              //'console.info(prediction);
              output.gestureId = prediction;
            });
          }
        };
        
      //Load random model from package:     works
      //Load random layers model from url:  works
      //Load random layers model from file: works
      //Load random graph model from file:  
      //Load own graph model from file:     works
      let onCreatedCB = 
        'state => {' +
        'console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");'+
        'let prepareModel = async () => {' +
        //'state.model = await state.modules.cocoSsd.load();' +
        'try {'+
        'state.model = await state.modules.emgClassifier.load();' +
        //'state.model = await state.modules.tf.loadGraphModel("file://C:/Users/Anas/Desktop/UbiInteract/ubii-nodejs-backend/test/sessions/integration-tests/tfjs-models/myo-rps/model.json");'+
        //'state.model = await state.modules.tf.loadLayersModel("https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json");'+
        //'state.model = await state.modules.tf.loadLayersModel("file://C:/Users/Anas/Desktop/UbiInteract/model.json");'+
        'console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");'+
        '} catch (err) {'+
        'throw err;'+
        '}'+
        '};' +
        'prepareModel();' +
        'console.log("??????????????????????????????????????????????");'+
        '};';

      let ubiiInteraction = {
        id: uuidv4(),
        name: 'rock-paper-scissors-game-interaction',
        onCreated: onCreatedCB.toString(),
        processingCallback: processCB.toString(),
        inputFormats: [
          {
            internalName: inputEmgData.internalName,
            messageFormat: inputEmgData.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: outputGestureData.internalName,
            messageFormat: outputGestureData.messageFormat
          }
        ],

      };

      // specification of a ubii.sessions.Session
      // https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      let ubiiSession = {
        id: uuidv4(),
        name: 'rock-paper-scissors-game-session',
        interactions: [ubiiInteraction],
        ioMappings: [
          {
            interactionId: ubiiInteraction.id,
            inputMappings: [
              {
                name: inputEmgData.internalName,
                topicSource: inputEmgData.topic
              }
            ],
            outputMappings: [
              {
                name: outputGestureData.internalName,
                topicDestination: outputGestureData.topic
              }
            ]
          }
        ]
      };

      // assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiInteraction = ubiiInteraction;

      this.$data.inputEmgData = inputEmgData;
      this.$data.outputGestureData = outputGestureData;

      this.$data.ubiiSession = ubiiSession;
    },
    startSession: function() {
      //prepare ui for the game - xxx          
      this.switchGameArea("ready-area");
      this.enableInput(false);

      UbiiClientService.isConnected().then(() => {  
        // create all the specifications we need to define our example application
        // these are protobuf messages to be sent to the server (saved in this.$data)
        this.createUbiiSpecs();

        //handle myo data
        this.updateMyoDevices();
        this.setPublishInterval(true);

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
            
            // start our session (registering not necessary as we do not want to save it permanently)
            UbiiClientService.client
              .callService({
                topic: DEFAULT_TOPICS.SERVICES.SESSION_START,
                session: this.$data.ubiiSession
              })
              .then(response => {
                console.info(response);
              });

              UbiiClientService.client.subscribe(
                this.$data.outputGestureData.topic,
                gestureData => {
                  //console.log ("collect data: UbiiClientService.client.subscribe()");
                  //if(this.collectGestureData && this.useGestureInput){
                  this.pushGestureData(gestureData);
                  }
              );

          });
      });
    },
    stopSession: function() {

      this.setPublishInterval(false);

      // unsubscribe and stop session
      UbiiClientService.client.unsubscribe(
        this.$data.outputGestureData.topic
      );
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
                this.setClient(clientID);
              } else {
                if (!this.$data.oldClients.includes(clientID)) {
                  this.setClient(clientID);
                }
              }
            }
          });
        });
      setTimeout(this.updateMyoDevices, 1000);
    },
    setClient: function(clientID) {
      
      //unsubscribe old client
      if(this.client){
        this.client.topics.forEach(topic => {
          // eslint-disable-next-line no-console
          console.log('unsubscribed to ' + topic);

          UbiiClientService.client.unsubscribe(topic);
        });
        this.client.sessions.forEach(session => {
          UbiiClientService.client.callService({
            topic: DEFAULT_TOPICS.SERVICES.SESSION_STOP,
            session: session
          });
        });
      }

      //create sessions and topics
      const myoEventTopic = clientID + '/web-interface-myo/myo_server_data';

      this.client = {
        id: clientID,
        sessions: [],
        topics: [myoEventTopic]
      };

      UbiiClientService.client.subscribe(
        myoEventTopic, 
        myoData => {
          var emg = {
            v0: myoData.emg.v0,
            v1: myoData.emg.v1,
            v2: myoData.emg.v2,
            v3: myoData.emg.v3,
            v4: myoData.emg.v4,
            v5: myoData.emg.v5,
            v6: myoData.emg.v6,
            v7: myoData.emg.v7
          };
          this.$data.emgData = emg;
          this.addEmgToBuffer(emg);
        }
      );
      console.log('subscribed to ' + myoEventTopic);
      this.oldClients.push(clientID);
    },
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++ data handling +++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    
    addEmgToBuffer: function(emg){
      while(this.emgBuffer.length >= 8){
        this.emgBuffer.shift();
      }
      this.emgBuffer.push(emg);
    },
    printEmgBuffer: function(){
      console.log(this.emgBuffer);
    },
    setPublishInterval: function(enable) {
      if(enable)
        this.publishInterval = setInterval(() => this.publishData(), 25);
      else{
        console.log("disble publish interval");
        clearInterval(this.publishInterval);
      }
    },
    publishData: function(){
      
      //Transform emgBuffer to proto format
      var msg_obj = {elements: []};
      
      this.emgBuffer.forEach((singleEmgArray) => {
        msg_obj.elements.push(singleEmgArray.v0);
        msg_obj.elements.push(singleEmgArray.v1);
        msg_obj.elements.push(singleEmgArray.v2);
        msg_obj.elements.push(singleEmgArray.v3);
        msg_obj.elements.push(singleEmgArray.v4);
        msg_obj.elements.push(singleEmgArray.v5);
        msg_obj.elements.push(singleEmgArray.v6);
        msg_obj.elements.push(singleEmgArray.v7);
      });

      //depricated

      /*UbiiClientService.client.publish(
        this.$data.ubiiDevice.name,
        this.$data.inputEmgData.topic,
        'int32List',
        msg_obj
      ); */
        UbiiClientService.publishRecord({
        topic: this.$data.inputEmgData.topic,
        int32List: msg_obj
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
        this.collectGestureData = enable;

        //enable/disable gesture input collecting
        //if(this.useGestureInput)
        //this.setPublishInterval(enable);

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
    pushGestureData: function(data) {
      if(this.collectGestureData && this.useGestureInput)
        this.gestureInputCollection.push(data); 
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
        console.log("scissor: "+cnt_1+" rock: "+cnt_2+" paper: "+cnt_3);
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
