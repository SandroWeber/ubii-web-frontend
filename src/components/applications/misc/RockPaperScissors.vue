<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <link
      rel="stylesheet"
      href="https://unpkg.com/purecss@1.0.1/build/pure-min.css"
      integrity="sha384-oAOxQR6DkCoMliIh8yFnu25d7Eq/PHS21PClpwjOTeU2jRSq11vu66rf90/cZr47"
      crossorigin="anonymous"
    />
    <div class="top-div">
      <div class="c">
        <br />
        <div class="box-area">
          <div id="game-area">
            <table class="sturdy">
              <tr>
                <th>Opponent</th>
              </tr>
              <tr>
                <td>
                  <div class="bigger-icon">
                    <font-awesome-icon
                      id="opponent-scissors-icon"
                      icon="hand-scissors"
                      class="interface-icon"
                    />
                    <font-awesome-icon
                      id="opponent-rock-icon"
                      icon="hand-rock"
                      class="interface-icon"
                    />
                    <font-awesome-icon
                      id="opponent-paper-icon"
                      icon="hand-paper"
                      class="interface-icon"
                    />
                  </div>
                </td>
              </tr>
            </table>

            <br />
            <table class="sturdy">
              <tr>
                <th>Player</th>
              </tr>
              <tr>
                <td>
                  <div class="bigger-icon">
                    <font-awesome-icon
                      id="player-scissors-icon"
                      icon="hand-scissors"
                      class="interface-icon"
                    />
                    <font-awesome-icon
                      id="player-rock-icon"
                      icon="hand-rock"
                      class="interface-icon"
                    />
                    <font-awesome-icon
                      id="player-paper-icon"
                      icon="hand-paper"
                      class="interface-icon"
                    />
                  </div>
                </td>
              </tr>
            </table>

            <br />
            <br />
            <div class="bottom-line">
              <button class="pure-button" @click="startGame()">Retry</button>
              <span class="text-field">
                <b>{{ winLoseMsg }}</b>
              </span>
            </div>
          </div>
          <div class="in-the-middle" id="text-area">
            <div id="message-text">{{ msgText }}</div>
            <br />
            <button class="pure-button" id="optional-retry-btn" @click="startGame()">Retry</button>
          </div>
          <div class="in-the-middle" id="ready-area">
            <button class="pure-button" @click="startGame()">Ready</button>
          </div>
        </div>
        <br />
        <input id="checkboxInput" type="checkbox" v-model="useGestureInput" />
        <label for="checkboxInput">Myo Gesture Input</label>
        <br />
        <br />
        <div class="pure-button-group" role="group" aria-label="...">
          <button class="pure-button" id="rock-btn" @click="buttonInput(2)">
            <font-awesome-icon icon="hand-rock" class="interface-icon" />
          </button>
          <button class="pure-button" id="paper-btn" @click="buttonInput(3)">
            <font-awesome-icon icon="hand-paper" class="interface-icon" />
          </button>
          <button class="pure-button" id="scissors-btn" @click="buttonInput(1)">
            <font-awesome-icon icon="hand-scissors" class="interface-icon" />
          </button>
        </div>
        <table class="otherTable">
          <tr>
            <td>
              <div class="rock-line" id="rock-amount"></div>
            </td>
            <td>
              <div class="paper-line" id="paper-amount"></div>
            </td>
            <td>
              <div class="scissors-line" id="scissors-amount"></div>
            </td>
          </tr>
        </table>

        <div class="gesture-field"></div>
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
      currentButtonInput: undefined, //button
      gestureInputCollection: [], //myo

      //final gestures
      playerGesture: 0,
      opponentGesture: 0,

      //ui related
      msgText: 'temp',
      winLoseMsg: 'win / lose message',

      //game related
      useGestureInput: true,
      collectGestureData: false,

      //stats
      percentRock: 0,
      percentPaper: 0,
      percentScissors: 0,

      //ubi-related
      ubiiClientService: UbiiClientService,
      myoDataTopicSource: ''
    };
  },
  methods: {
    //create specifications for the protobuf messages
    createUbiiSpecs: function() {
      //helper definitions that we can reference later
      let deviceName = 'rock-paper-scissors-game';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
      let inputMyoData = {
        internalName: 'myoData',
        messageFormat: 'ubii.dataStructure.MyoEvent',
        topic: ''
      };
      let outputGestureData = {
        internalName: 'gestureId',
        messageFormat: 'ubii.dataStructure.Int32',
        topic: topicPrefix + '/' + 'gesture_id'
      };

      //specification of a ubii.devices.Device
      //https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/devices/device.proto
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: outputGestureData.topic,
            messageFormat: outputGestureData.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
          }
        ]
      };

      //callback for classifying the emg array and get performed gesture
      let processCB =
        '(input, output, state) => {' +
        'if(input.myoData && state.model){' +
        'state.emgBuffer.push(input.myoData.emg.v0);' +
        'state.emgBuffer.push(input.myoData.emg.v1);' +
        'state.emgBuffer.push(input.myoData.emg.v2);' +
        'state.emgBuffer.push(input.myoData.emg.v3);' +
        'state.emgBuffer.push(input.myoData.emg.v4);' +
        'state.emgBuffer.push(input.myoData.emg.v5);' +
        'state.emgBuffer.push(input.myoData.emg.v6);' +
        'state.emgBuffer.push(input.myoData.emg.v7);' +
        'while(state.emgBuffer.length > 64){' +
        'state.emgBuffer.shift();' +
        '}' +
        'if(state.emgBuffer.length == 64){' +
        'let predict = async () => {' +
        'let tensor = state.modules.tf.tensor2d(state.emgBuffer, [1,64]);' +
        'let prediction = await state.model.predict(tensor);' +
        'state.emgBuffer = [];' +
        'return prediction;' +
        '};' +
        'predict().then(prediction => {' +
        'let getData = async () => {' +
        'let data = await prediction.data();' +
        'dataConv = parseInt(data.toString());' +
        'if(!dataConv) {' +
        'dataConv = 0;' +
        '}' +
        'return dataConv;' +
        '};' +
        'getData().then(data => {' +
        'output.gestureId = data;' +
        '});' +
        '});' +
        '}' +
        '};' +
        '};';

      //Load emg classifier model and save it in state
      let onCreatedCB =
        'state => {' +
        'let prepareModel = async () => {' +
        'try {' +
        'state.model = await state.modules.emgClassifier.load();' +
        '} catch (err) {' +
        'throw err;' +
        '}' +
        '};' +
        'prepareModel();' +
        'state.emgBuffer = [];' +
        '};';

      //specification of a ubii.interactions.Interaction
      let ubiiInteraction = {
        id: uuidv4(),
        name: 'rock-paper-scissors-game-interaction',
        onCreated: onCreatedCB.toString(),
        processingCallback: processCB.toString(),
        inputFormats: [
          {
            internalName: inputMyoData.internalName,
            messageFormat: inputMyoData.messageFormat
          }
        ],
        outputFormats: [
          {
            internalName: outputGestureData.internalName,
            messageFormat: outputGestureData.messageFormat
          }
        ]
      };

      //specification of a ubii.sessions.Session
      //https://gitlab.lrz.de/IN-FAR/Ubi-Interact/ubii-msg-formats/blob/develop/src/proto/sessions/session.proto
      let ubiiSession = {
        id: uuidv4(),
        name: 'rock-paper-scissors-game-session',
        interactions: [ubiiInteraction],
        ioMappings: [
          {
            interactionId: ubiiInteraction.id,
            inputMappings: [
              {
                name: inputMyoData.internalName,
                topicSource: this.myoDataTopicSource
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

      //assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.ubiiInteraction = ubiiInteraction;

      this.$data.inputMyoData = inputMyoData;
      this.$data.outputGestureData = outputGestureData;

      this.$data.ubiiSession = ubiiSession;
    },

    startSession: function() {
      //prepare ui
      this.switchGameArea('ready-area');
      this.enableInput(false);
      this.updateGraphs();

      //for building ui
      /* this.switchGameArea("game-area");
      this.chooseGestureForOpponent();
      this.changeIcon("player", 1); */

      UbiiClientService.isConnected().then(() => {
        //find myo topic & set it as input
        this.findMyoTopic().then(() => {
          // create all specifications
          this.createUbiiSpecs();

          // register device
          UbiiClientService.registerDevice(this.$data.ubiiDevice)
            .then(device => {
              this.$data.ubiiDevice = device;
              return device;
            })
            .then(() => {
              // start our session (registering not necessary as we do not want to save it permanently)
              UbiiClientService.client
                .callService({
                  topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
                  session: this.$data.ubiiSession
                })
                .then(response => {
                  console.info(response);
                });
              //subscribe to our classied output gesture topic
              UbiiClientService.client.subscribeTopic(
                this.$data.outputGestureData.topic,
                this.handleGestureData
              );
            });
        });
      });
    },

    //unsubscribe and stop session
    stopSession: function() {
      UbiiClientService.client.unsubscribeTopic(
        this.$data.outputGestureData.topic,
        this.handleGestureData
      );
      UbiiClientService.client.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: this.$data.ubiiSession
      });
    },

    handleGestureData: function(gestureData) {
      this.pushGestureData(gestureData);
    },

    resolveAfter2Seconds: function() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve('resolved');
        }, 2000);
      });
    },

    //look for myo interfaces
    findMyoTopic: async function() {
      return new Promise(resolve => {
        UbiiClientService.client
          .callService({ topic: DEFAULT_TOPICS.SERVICES.TOPIC_LIST })
          .then(reply => {
            this.$data.topicList = reply.stringList.list;

            this.$data.topicList.forEach(topic => {
              const topicIndex = topic.indexOf('/web-interface-myo/');

              if (topicIndex !== -1) {
                this.myoDataTopicSource = topic;
                resolve();
              }
            });
          });
      });
    },

    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++ game logic ++++++++++++++++++++++++++++++++++++++
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    //manage different screens
    switchGameArea: function(id) {
      var game_area = document.getElementById('game-area');
      var txt_area = document.getElementById('text-area');
      var rdy_area = document.getElementById('ready-area');

      switch (id) {
        case 'game-area':
          game_area.style.display = 'block';
          txt_area.style.display = 'none';
          rdy_area.style.display = 'none';
          break;
        case 'text-area':
          game_area.style.display = 'none';
          txt_area.style.display = 'block';
          rdy_area.style.display = 'none';
          break;
        case 'ready-area':
          game_area.style.display = 'none';
          txt_area.style.display = 'none';
          rdy_area.style.display = 'block';
          break;
        default:
          console.error('Invalid area id: ' + id);
      }
    },

    //display the correct gesture for player or opponent
    changeIcon: function(playerId, iconId) {
      if (playerId == 'player') {
        //get all icons enable the correct one
        var player_icon_1 = document.getElementById('player-scissors-icon');
        player_icon_1.style.display = 'none';
        var player_icon_2 = document.getElementById('player-rock-icon');
        player_icon_2.style.display = 'none';
        var player_icon_3 = document.getElementById('player-paper-icon');
        player_icon_3.style.display = 'none';
        switch (iconId) {
          case 1:
            player_icon_1.style.display = 'inline';
            break;
          case 2:
            player_icon_2.style.display = 'inline';
            break;
          case 3:
            player_icon_3.style.display = 'inline';
            break;
          default:
            console.error('Invalid iconId: ' + iconId);
        }
      } else if (playerId == 'opponent') {
        //get all icons enable the correct one
        var opponent_icon_1 = document.getElementById('opponent-scissors-icon');
        opponent_icon_1.style.display = 'none';
        var opponent_icon_2 = document.getElementById('opponent-rock-icon');
        opponent_icon_2.style.display = 'none';
        var opponent_icon_3 = document.getElementById('opponent-paper-icon');
        opponent_icon_3.style.display = 'none';
        switch (iconId) {
          case 1:
            opponent_icon_1.style.display = 'inline';
            break;
          case 2:
            opponent_icon_2.style.display = 'inline';
            break;
          case 3:
            opponent_icon_3.style.display = 'inline';
            break;
          default:
            console.error('Invalid iconId: ' + iconId);
        }
      } else {
        console.error('Invalid playerId:' + playerId);
      }
    },

    //choose random gestre between 1-3 for opponent
    chooseGestureForOpponent: function() {
      var gestureId = Math.round(Math.random() * 2 + 1);
      this.opponentGesture = gestureId;
      this.changeIcon('opponent', this.opponentGesture);
    },

    //game logic
    startGame: function() {
      //delete previous data
      this.updateGraphs();

      var btn = document.getElementById('optional-retry-btn');
      btn.style.display = 'none';

      this.$data.msgText = '3';
      this.switchGameArea('text-area');
      this.updateGraphs();

      //countdown
      setTimeout(() => {
        this.$data.msgText = '2';
        setTimeout(() => {
          this.$data.msgText = '1';
          setTimeout(() => {
            this.$data.msgText = 'GO!';
            this.enableInput(true);
            setTimeout(() => {
              //no input detected
              if (
                (this.currentButtonInput == undefined ||
                  this.currentButtonInput == 0) &&
                this.gestureInputCollection.length == 0
              ) {
                this.noInputMessage(btn);
              }
              //evaluate game
              else {
                if (this.gestureInputCollection.length == 0)
                  this.playerGesture = this.currentButtonInput;
                else this.getBestGesture();

                this.chooseGestureForOpponent();
                this.evaluateGame(this.playerGesture);
                this.switchGameArea('game-area');
              }
              //disable input and reset vars
              this.enableInput(false);
              this.playerGesture = this.currentButtonInput = 0;
              this.gestureInputCollection = [];
            }, 2000);
          }, 1000);
        }, 1000);
      }, 1000);
    },

    noInputMessage: function(btn) {
      this.$data.msgText = 'No input detected :(';
      btn.style.display = 'inline';
      this.switchGameArea('text-area');
    },

    //figure out who won the game
    evaluateGame: function(gesture) {
      if (
        (gesture == 1 && this.opponentGesture == 1) ||
        (gesture == 2 && this.opponentGesture == 2) ||
        (gesture == 3 && this.opponentGesture == 3)
      ) {
        this.winLoseMsg = "It's a draw";
      } else if (
        (gesture == 1 && this.opponentGesture == 3) ||
        (gesture == 2 && this.opponentGesture == 1) ||
        (gesture == 3 && this.opponentGesture == 2)
      ) {
        this.winLoseMsg = 'You win!';
      } else if (
        (gesture == 1 && this.opponentGesture == 2) ||
        (gesture == 2 && this.opponentGesture == 3) ||
        (gesture == 3 && this.opponentGesture == 1)
      ) {
        this.winLoseMsg = 'You lose!';
      } else {
        console.error(
          'Invalid gesture id. player: ' +
            this.gesture +
            ' opponent: ' +
            this.opponentGesture
        );
      }
    },

    //on-click for ui buttons
    buttonInput: function(id) {
      this.currentButtonInput = id;
      this.changeIcon('player', id);
    },

    //input is only enabled after the count ended and before the evaluation
    enableInput: function(enable) {
      if (this.useGestureInput) this.lockButtons(false);
      else this.lockButtons(enable);
      this.collectGestureData = enable;
    },

    //enables/disables buttons for the game
    lockButtons: function(enable) {
      var scissor_btn = document.getElementById('scissors-btn');
      if (scissor_btn == null) console.error('scissor btn faulty');
      var rock_btn = document.getElementById('rock-btn');
      if (rock_btn == null) console.error('rock btn faulty');
      var paper_btn = document.getElementById('paper-btn');
      if (paper_btn == null) console.error('paper btn faulty');

      if (enable) {
        scissor_btn.className = 'pure-button';
        rock_btn.className = 'pure-button';
        paper_btn.className = 'pure-button';
      } else {
        scissor_btn.className = 'pure-button pure-button-disabled';
        rock_btn.className = 'pure-button pure-button-disabled';
        paper_btn.className = 'pure-button pure-button-disabled';
      }
    },

    //fills array with the id of the currently detected gesture
    pushGestureData: function(data) {
      if (this.collectGestureData && this.useGestureInput) {
        this.gestureInputCollection.push(data);
        this.updateGraphs();
      }
    },

    //chooses a gesture from input array
    getBestGesture: function() {
      if (this.gestureInputCollection.length == 0) return;
      else {
        var cnt_1 = 0;
        var cnt_2 = 0;
        var cnt_3 = 0;

        //count gesture ids
        this.gestureInputCollection.forEach(element => {
          switch (element) {
            case 1:
              cnt_1++;
              break;
            case 2:
              cnt_2++;
              break;
            case 3:
              cnt_3++;
              break;
          }
        });

        if (cnt_1 == 0 && cnt_2 == 0 && cnt_3 == 0) {
          this.noInputMessage(document.getElementById('optional-retry-btn'));
          return;
        }
        //choose most frequent gesture
        else if (cnt_1 >= cnt_2 && cnt_1 >= cnt_3) {
          this.playerGesture = 1;
        } else if (cnt_2 >= cnt_1 && cnt_2 >= cnt_3) {
          this.playerGesture = 2;
        } else if (cnt_3 >= cnt_1 && cnt_3 >= cnt_2) {
          this.playerGesture = 3;
        }
        this.changeIcon('player', this.playerGesture);
        //console.log("scissor: "+cnt_1+" rock: "+cnt_2+" paper: "+cnt_3);
        console.log('Input collection: ' + this.gestureInputCollection);
      }
    },

    //display graphs according to inputs
    updateGraphs: function() {
      var r = document.getElementById('rock-amount');
      var p = document.getElementById('paper-amount');
      var s = document.getElementById('scissors-amount');
      var cnt_1 = 0;
      var cnt_2 = 0;
      var cnt_3 = 0;

      //count gesture ids
      this.gestureInputCollection.forEach(element => {
        switch (element) {
          case 1:
            cnt_1++;
            break;
          case 2:
            cnt_2++;
            break;
          case 3:
            cnt_3++;
            break;
        }
      });
      if (cnt_1 == 0) {
        this.percentScissors = 0;
        s.style.height = '0';
      } else {
        this.percentScissors = Math.round(
          (cnt_1 / (cnt_1 + cnt_2 + cnt_3)) * 100
        );
        s.style.height = this.percentScissors.toString() + '%';
      }
      if (cnt_2 == 0) {
        this.percentRock = 0;
        r.style.height = '0';
      } else {
        this.percentRock = Math.round((cnt_2 / (cnt_1 + cnt_2 + cnt_3)) * 100);
        r.style.height = this.percentRock.toString() + '%';
      }
      if (cnt_3 == 0) {
        this.percentPaper = 0;
        p.style.height = '0';
      } else {
        this.percentPaper = Math.round((cnt_3 / (cnt_1 + cnt_2 + cnt_3)) * 100);
        p.style.height = this.percentPaper.toString() + '%';
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
  width: 500px;
  margin: auto;
  border: 3px #B6B5AA;
  height: 400px;
  background-color: layerTwoSecondaryColor;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.bottom-line {
  padding: 10px;
  text-align: left;
  background-color: layerFourSecondaryColor;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.text-field {
  padding-left: 130px;
  text-align: center;
}

.gesture-field {
  height: 100%;
  width: 150px;
  height: 100px;
  margin: auto;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.bigger-icon {
  font-size: 250%;
}

.in-the-middle {
  padding-top: 140px;
}

table {
  margin: 15px 0;
  table-layout: fixed;
  width: 150px;
  margin-left: auto;
  margin-right: auto;
}

table, th, td {
  border-collapse: collapse;
  padding: 8px;
}

td {
  text-align: middle;
  background-color: layerThreeSecondaryColor;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

th {
  text-align: middle;
  background-color: layerFourSecondaryColor;
  border-bottom: 1px solid layerThreeSecondaryColor;
  color: orangeAccentColor;
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
}

.rock-line {
  width: 32px;
  height: 60%;
  background-color: blueAccentColor;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}

.paper-line {
  width: 32px;
  height: 10%;
  background-color: blueAccentColor;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}

.scissors-line {
  width: 32px;
  height: 30%;
  background-color: blueAccentColor;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
}

.otherTable {
  border-collapse: collapse;
  background-color: layerThreeSecondaryColor;
  margin: 0px 0;
  table-layout: fixed;
  width: 144px;
  height: 100px;
  margin-left: auto;
  margin-right: auto;
}

.otherTable td {
  text-align: center;
  vertical-align: top;
  border-bottom-right-radius: 0px;
  border-bottom-left-radius: 0px;
}

.otherTable td:last-child {
  border-bottom-right-radius: 8px;
}

.otherTable td:first-child {
  border-bottom-left-radius: 8px;
}
</style>
