<template>
  <div style="overflow: scroll">
  <Error :alert="trigger" :msg="msg"/>
    <b-modal id="mocfunc" size="xl">
      <b-form-textarea
        id="textarea-auto-height"
        rows="3"
        max-rows="8"
        v-model="ocfunc"
        overflow-x:scroll
      ></b-form-textarea>  
    </b-modal>
    <b-modal id="mohfunc" size="xl">
      <b-form-textarea
        id="textarea-auto-height"
        rows="3"
        max-rows="8"
        v-model="ohfunc"
        overflow-x:scroll
      ></b-form-textarea>  
    </b-modal>
    <b-modal id="mopfunc" size="xl">
      <b-form-textarea
        id="textarea-auto-height"
        rows="3"
        max-rows="8"
        v-model="opfunc"
        overflow-x:scroll
      ></b-form-textarea>  
    </b-modal>
    <b-modal id="modfunc" size="xl">
      <b-form-textarea
        id="textarea-auto-height"
        rows="3"
        max-rows="8"
        v-model="odfunc"
        overflow-x:scroll
      ></b-form-textarea>  
    </b-modal>
    <b-tabs content-class="mt-3" class="ubii-graph-tabs">
      <b-tab title="Select a Session" active>
        <div class="header-editor">
          <b-col>
            <span>Select a Session from Runtime:</span>
            <treeselect v-model="selectedSessionId" 
              @input="showSessionPipeline()"
              @open="loadOps"
              :load-options="loadOps" 
              :options="availableSessions" 
              :auto-load-root-options="false" 
              :multiple="false" 
              placeholder="Sessions..."/>
          </b-col>
        </div>
      </b-tab>
      <b-tab title="New Session">
        <div class="header-editor">
          <b-col>
            <span>Create a new session:</span>
            <b-form-input v-model="SessionNameForNew" placeholder="Enter a new name for the session"></b-form-input>
            <div class="w-100"><hr></div>
            <b-button @click="NewSession()" variant="outline-primary" >New Session</b-button>
          </b-col>
        </div>
      </b-tab>
      <b-tab title="Test">
        <div class="header-editor">
          <b-col>
            <span>Dummy Session for testing:</span>
            <b-form-select
              @change="importSession()"
              v-model="selected_session" :options="options_sessions_saved">
            </b-form-select>
          </b-col>
        </div>
      </b-tab>
    </b-tabs>
  <div>
    <div class="button-editor flex-nowrap ">
      <b-row>
        <b-col>
          <div style="text-align: center;">
            <b-form-select
            @change="reOrderGraph()"
            v-model="selected_scene_order" :options="options_scene_order"></b-form-select>
          </div>
          <div style="text-align: center; border-style: dashed;">
            <b-button @click="playGraph()" variant="outline-primary" style="margin: 2px;" :disabled="deactivatePlay">
              <font-awesome-icon icon="play" style="color: green; display: flex;" class="tile-menu-icon" />  
            </b-button>
            <b-button @click="stopGraph()" variant="outline-primary" style="margin: 2px;">
              <font-awesome-icon icon="stop" style="color: grey; display: flex;" class="tile-menu-icon" /> 
            </b-button>
            <b-button @click="saveGraph()" variant="outline-primary" style="margin: 2px;" :disabled="playActive">
              <font-awesome-icon icon="save" class="tile-menu-icon"/> Save Session
            </b-button>
            <b-button @click="saveToLocalStorage()" variant="outline-primary" style="margin: 2px;" :disabled="playActive">
              <font-awesome-icon icon="save" class="tile-menu-icon" /> Save Positions of Nodes
            </b-button>
          </div>
        </b-col>
      </b-row>
    </div>
  </div>
  <div align="center">
    <b-row no-gutters class="flex-nowrap" align="center">
      <b-col cols="5">
        <b-tabs content-class="mt-3" class="ubii-graph-tabs">
          <b-tab title="Clients" active>
            <b-list-group>
              <b-list-group-item variant="dark">Add <span style="color: blue">Clients</span> to the Graph. 
              <b-button @click="refresh('clients')" variant="outline-primary" style="margin: 2px;">
                <font-awesome-icon icon="sync" style="display: flex;" class="tile-menu-icon" /> 
              </b-button>
              <b-button @click="filterList('clients')" variant="outline-primary" style="margin: 2px;">
                <font-awesome-icon icon="filter" style="display: flex;" class="tile-menu-icon" /> 
              </b-button>
            </b-list-group-item>
              <b-list-group-item variant="dark" v-for="clientDev in addClientsList" :key="clientDev.id">
                <b-card
                  title="Client.Device.Name"
                  bg-variant="dark" 
                  text-variant="white"
                  v-on:dragstart="dragStart(clientDev)"
                  v-on:drag="dragging"
                  draggable="true"
                >
                <b-card-text>{{clientDev.id}}.{{clientDev.name}}</b-card-text>
                <font-awesome-icon icon="arrows-alt" class="dragPos" />
                <!-- <div >
                  <b-button @click="addClientToGraph(clientDev)" variant="outline-primary" style="margin: 2px;">Add Client to the Graph</b-button>
                  <b-button @click="removeClientNode(clientDev)" variant="outline-primary" style="margin: 2px;">Remove Client from the Graph</b-button>
                </div> -->
                </b-card>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
          <b-tab title="Processing Modules">
            <b-list-group>
              <b-list-group-item variant="dark">Add <span style="color: green">Processing Modules</span> to the Graph.
              <b-button @click="refresh('procs')" variant="outline-primary" style="margin: 2px;">
                <font-awesome-icon icon="sync" style="display: flex;" class="tile-menu-icon" /> 
              </b-button>
              <b-button @click="filterList('procs')" variant="outline-primary" style="margin: 2px;">
                <font-awesome-icon icon="filter" style="display: flex;" class="tile-menu-icon" /> 
              </b-button>
              </b-list-group-item>
              <b-list-group-item variant="dark" v-for="proc in addProcsList" :key="proc.id">
                <b-card
                  title="Processing Module Name"
                  bg-variant="dark" 
                  text-variant="white"
                  v-on:dragstart="dragStart(proc)"
                  v-on:drag="dragging"
                  draggable="true"
                >
                <b-card-text>{{proc.name}}</b-card-text>
                <b-form-select v-model="selectedProcId" :options="proc.ids"></b-form-select>
                <font-awesome-icon icon="arrows-alt" class="dragPos" />
                <!-- <div >
                  <b-button @click="addProcToGraph(proc)" variant="outline-primary" style="margin: 2px;">Add PM the Graph</b-button>
                  <b-button @click="removeProcNode(proc)" variant="outline-primary" style="margin: 2px;">Remove PM from the Graph</b-button>
                </div> -->
                </b-card>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
          <b-tab title="Message Inspector">
            <b-container class="debug-row">
              <b-row id="dIn" ref="DebugInputs" class="flex-nowrap justify-left" style="border: 1px solid; overflow: auto; padding: 1em"> 
              </b-row>
              <b-row id="dOut" ref="DebugOutputs" class="flex-nowrap justify-left" style="border: 1px solid; overflow: auto; padding: 1em"> 
              </b-row>
              <!-- <b-row style="border: 1px solid">
                <b-col v-if="debug.func">
                  <div style="padding: 0.5em 0.5em 0.5em">
                    <b-card
                      tag="article"
                      style="width: 100%; max-height: 20rem;"
                      bg-variant="dark" 
                      text-variant="white"
                    >
                      <b-card-text style="font-size: small;">
                        function
                      </b-card-text>
                      
                    </b-card>
                  </div>
                </b-col>
              </b-row> -->
            </b-container>
          </b-tab>
          <b-tab title="Debug the Debugger">
            <b-form-textarea
                        id="textarea-auto-height"
                        rows="30"
                        max-rows="30"
                        v-model="sessionUpdate"
                        overflow-x:scroll
                      ></b-form-textarea>
          </b-tab>  
        </b-tabs>
      </b-col><b-col>
        <b-overlay :show="lforce" rounded="sm">
          <canvas id="canvas" class='litegraph' width='1024' height='720' style='border: 1px solid;' v-on:drop="drop" v-on:dragover="allowDrop"></canvas>
        </b-overlay>
      </b-col>
    </b-row>
  </div>
  </div>
</template>
<script>

// Fontawesome.
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faPlay,
  faStop,
  faSync,
  faSave,
  faFilter,
  faArrowsAlt,

} from '@fortawesome/free-solid-svg-icons';
library.add(faPlay, faStop, faSync, faSave, faFilter, faArrowsAlt);

import * as litegraph from "litegraph.js";
// import uuid4 from "uuid";
import "litegraph.js/css/litegraph.css";

import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import Error from './components/Error.vue'
import TopicViewer from './components/TopicViewer.vue'

import Vue from 'vue'
import Treeselect from '@riophae/vue-treeselect'
// import the styles
import '@riophae/vue-treeselect/dist/vue-treeselect.css'


import { BootstrapVue } from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)

import cm from './funcsClientProcs/clientFuncs.js'
import pm from './funcsClientProcs/procsFuncs.js'
import pc from './nodePos/posCalc.js'

export default {
  name: "LiteGraph",
  components: {
    Treeselect,
    Error
  },
  data() {
    return {
      lforce: false,
      outputContext: null,
      context: null,
      graph: null,
      lGraphCanvas: null,

      trigger: 0,
      msg: '',

      selectedSessionId: null,
      selectedSession: null,
      availableSessions: null,
      sessionUpdate: null,

      clientsOfInterest: null,

      addClientsList: [],
      addProcsList: [],
      selectedProcId: 'New',

      latenz: [],
      timer: null,

      options_scene_order:  [
          { value: 'ps', text: 'Position Nodes by Saved Positions' },
          { value: 'ls', text: 'Position Nodes as List' },
          { value: 'fs', text: 'Position Nodes as Force graph' },

      ],
      selected_scene_order: 'ps',

      options_sessions_saved:  [
          { value: null, text: 'Import a not wokring dummy Session' },

      ],
      selected_session: null,
      SessionNameForNew: 'New',

      ClSeNodes: [],
      debug: { 
        id: null,
        active_inputs: [],
        active_outputs: []
      },
      ocfunc: '',
      opfunc: '',
      ohfunc: '',
      odfunc: '',

      draggedObject: null,
      playActive: false,
      deactivatePlay: false,
    };
  },

  async mounted() {
    UbiiClientService.instance.setName('ubii-node-webbrowser VueJS Test');
    UbiiClientService.instance.setHTTPS(false);
    
    await UbiiClientService.instance.connect(this.serverIP, this.servicePort);
    // const cid = UbiiClientService.instance.getClientID()
    // this.ws = await new UbiiWebsocketService(cid, 'localhost', 8104)
    
    this.graph = new litegraph.LGraph();
    this.subgraph = new litegraph.LGraph();
    this.lGraphCanvas = new litegraph.LGraphCanvas('#canvas', this.graph);
    // this.graph.start();
    
    litegraph.LiteGraph.clearRegisteredTypes()      
  },
  methods: {
    clearBeforeRender: async function() {
      this.ClSeNodes = []
      this.addClientsList = []
      this.addProcsList = [],
      this.latenz = []
      this.$refs.DebugInputs.innerHTML = ''
      this.$refs.DebugOutputs.innerHTML = ''
      this.debug = {
        id: null,
        active_inputs: [],
        func: null,
        active_outputs: []
      }
      this.deactivatePlay = false
      clearInterval(this.timer)
      this.graph.clear()
      litegraph.LiteGraph.clearRegisteredTypes()
    },
    ubiiGetResult: async function(topic) {
      await UbiiClientService.instance.waitForConnection()
      const res = await UbiiClientService.instance.client.callService(
        {
          topic: topic
        }
      ) 
      return res

    },
    addClientsToList: async function() {
      this.addClientsList = []
      this.clientsOfInterest.filter(val => val.state === 0).forEach(client => {   
        client.devices.forEach(dev => {
          this.addClientsList.push(
            {
              id: dev.clientId+'.'+dev.id,
              name: dev.name,
              client: true 
            }
          )
        })
      })
    },
    
    loadLatenz: async function() {
      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.LATENZ_CLIENTS_LIST)
      this.latenz = res.clientList.elements
    },
    loadSession: async function () {
      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_GET_LIST)
      const sList = res.sessionList.elements
      //console.warn('Session:', sList)
      try { 
        this.selectedSession = sList.filter(val => val.status === 1 && this.selectedSessionId == val.id)[0]
        this.sessionUpdate = JSON.stringify(this.selectedSession, null, 2)
      } catch {
        this.msg = 'Selected Session was not found.'
        this.trigger= !this.trigger
      }
    },
    // loadTopics: async function () {
    //   const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.TOPIC_LIST)
    //   console.log(res)
    // },
    loadClients: async function (filts) {

      const cList = this.addClientsList

      const clientFilts = filts.map(val => {
        return val.split('.')[0]
      })
      
      const deviceFilts = filts.map(val => {
        return val.split('.')[1]
      })

      try {
        this.clientsOfInterest = cList.filter(val => val.state === 0 && clientFilts.includes(val.id.split('.')[0]) && deviceFilts.includes(val.device.name))
      } catch {
        
        this.msg = 'No Clients are available for this session.'
        this.trigger= !this.trigger
      }
      
    },
    loadOps: async function() {

      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_GET_LIST)
      const sList = res.sessionList.elements

      try { 
        this.availableSessions = sList.filter(val => val.status === 1).map(val => {
          return { 
            id: val.id,
            label: `${val.name}`
          }
        })
      } catch {
        this.msg = 'No sessions available.'
        this.trigger= !this.trigger// console.log('An empty or a invalid response from the server.')
      }

    },
    callback: async function() {
      console.warn('CALLBACK')
    },
    registerInputTypes: async function() {
      
      //       import {
      // ProtobufTranslator,
      // MSG_TYPES,
      // DEFAULT_TOPICS,
      // proto
      // } from '@tum-far/ubii-msg-formats'
      // console.log(proto);


      const types = ['double', 'bool', 'string', 'ubii.dataStructure.Vector2', 'ubii.dataStructure.Vector3', 'ubii.dataStructure.Vector4',
       'ubii.dataStructure.Quaternion', 'ubii.dataStructure.Matrix3x2', 'ubii.dataStructure.Matrix4x4', 'ubii.dataStructure.Color', 
       'ubii.dataStructure.TouchEvent', 'ubii.dataStructure.TouchEventList', 'ubii.dataStructure.KeyEvent', 'ubii.dataStructure.MouseEvent',
       'ubii.dataStructure.MyoEvent', 'ubii.dataStructure.Pose2D', 'ubii.dataStructure.Pose3D', 'ubii.dataStructure.Object2D', 
       'ubii.dataStructure.Object3D', 'ubii.dataStructure.Object2DList', 'ubii.dataStructure.Object3DList', 'int32',
       'float', 'ubii.dataStructure.Int32List', 'ubii.dataStructure.FloatList', 'ubii.dataStructure.DoubleList', 'ubii.dataStructure.StringList',
       'ubii.dataStructure.BoolList', 'ubii.dataStructure.Image2D', 'ubii.dataStructure.Image2DList', 'ubii.sessions.Session', 'ubii.processing.ProcessingModuleList']

      types.forEach(val => {
        function node()
        {
          this.addOutput(val, val)
        }
        node.title = 'Input.' + val
        node.title_color = "#cf331f"
        litegraph.LiteGraph.registerNodeType("Input/"+val, node)
      })
      

    },
    registerProcessNode: function(sname, proc, inp, out) {

      //node constructor class
      function node()
      {
        this.size = [400, 120];
        this.id = proc.id
        inp.forEach(i => {
          this.addInput(i.internalName, i.messageFormat)
        })
        out.forEach(o => {
          this.addOutput(o.internalName, o.messageFormat)
        })

        this.options =  that.addClientsList.map(val => { return val.id.split('.')[0]})
        this.lang = this.addWidget("combo","language:", 'JS', (e) => {
          console.warn(e)
        }, { values: ['CPP', 'PY', 'JS', 'CS', 'JAVA']});
        //console.warn(this.options)
        this.combo = this.addWidget("combo","Client:", this.options[0], (e) => {
          console.warn(e)
        }, { values:this.options} );
        // this.combo = this.addWidget("combo","Running on Client:", "red", callback, { values:["red","green","blue"]} );
        console.warn(proc)
        this.chHz = this.addWidget("number","Frequency:", Number(proc.processingMode.frequency.hertz), function(/*value, widget, node*/){
          // console.warn(value, widget, node)
        }, { min: 0, max: 100, step: 100})
        this.addWidget("button","Show onCreatedStringified",null,function(){
          that.ocfunc = proc.onCreatedStringified
          that.$bvModal.show('mocfunc')
        });
        this.addWidget("button","Show onProcessingStringified",null,function(){
          that.opfunc = proc.onProcessingStringified
          that.$bvModal.show('mopfunc')
        });
        this.addWidget("button","Show onHaltedStringified",null,function(){
          that.ohfunc = proc.onHaltedStringified
          that.$bvModal.show('mohfunc')
        });
        this.addWidget("button","Show onDeletedStringified",null,function(){
          that.odfunc = proc.onDestroyedStringified
          that.$bvModal.show('modfunc')
        });

        this.size = this.computeSize()
        
      }
      node.title = proc.name
      node.title_color = "#243";
      node.slot_start_y = 20;
      
      let that = this
      
    
      node.prototype.onDrawForeground = function()
      {
        this.size[0] = 400
        if(this.flags.collapsed)
          return; 
        // ; 
      }


      //function to call when the node is executed
      node.prototype.onExecute = function()
      {
        out.forEach((_,i) => {
          this.triggerSlot(i)
        })
      }

      litegraph.LiteGraph.registerNodeType("ProcessingModuleClasses/"+proc.sessionId+"/"+proc.name, node)
      
      node.prototype.onDrawTitle = function(ctx) {
        if (this.flags.collapsed) {
            return;
        }

        ctx.fillStyle = "#1c2e4a";
        var w = litegraph.LiteGraph.NODE_TITLE_HEIGHT;
        var x = this.size[0] - w;
        ctx.fillRect(x, -w, w+1, w);
        ctx.fillStyle = "#8cd2e8";
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, -w * 0.6);
        ctx.lineTo(x + w * 0.8, -w * 0.6);
        ctx.lineTo(x + w * 0.5, -w * 0.3);
        ctx.fill();

        ctx.fillStyle = "#555";
        ctx.fillRect(0,0,this.size[0],20);

        ctx.fillStyle = "#AAA";
        ctx.fillText("Proc.ID:"+this.id, 2, 15 );
      };

      node.prototype.onConnectionsChange = function(inOrOut, slot, state, link_info, input_info) {
          that.stopGraph()
          if (!that.debug.id) return
          // console.log('Input or Output', inOrOut);
          // console.log('slot', slot);
          // console.log('state', state);
          // console.log('link_info', link_info);
          // console.log('input_info', input_info);

          // input remove
          // output remove
          // input add
          // output add
          let nodeIndex = -1
          if(inOrOut == 1 && !state) {
            that.debug.active_inputs.forEach((val,index) => {
              if(val.name === input_info.name)
                nodeIndex = index
            })
            if (nodeIndex > -1) {  
              let element = that.debug.active_inputs[nodeIndex].component.$el
              element.remove()
              that.debug.active_inputs.splice(nodeIndex, 1);
            }
          } else if (inOrOut == 2 && !state) {
            that.debug.active_outputs.forEach((val,index) => {
              if(val.name === input_info.name)
                nodeIndex = index
            })
            if (nodeIndex > -1) {  
              let element = that.debug.active_outputs[nodeIndex].component.$el
              element.remove()
              that.debug.active_outputs.splice(nodeIndex, 1);
            }
          } else if (inOrOut == 1 && state) {
              const topic = that.selectedSession.ioMappings.filter(pval => pval.processingModuleId === this.id)[0].inputMappings.filter(io => io.inputName === input_info.name)[0].topic
              that.debug.active_inputs.push({name: input_info.name, type: input_info.type, topic: topic, component: that.dynInComp(input_info.name, input_info.type, "in")})
          } else if (inOrOut == 2 && state) {
              const topic = that.selectedSession.ioMappings.filter(pval => pval.processingModuleId === this.id)[0].outputMappings.filter(io => io.outputName === input_info.name)[0].topic
              that.debug.active_outputs.push({name: input_info.name, type: input_info.type, topic: topic, component: that.dynInComp(input_info.name, input_info.type, "out")})
          }
      },
      node.prototype.onMouseDown = function(e, pos) {
        if (
            !this.flags.collapsed &&
            pos[0] > this.size[0] - litegraph.LiteGraph.NODE_TITLE_HEIGHT &&
            pos[1] < 0
        ) {
            that.debug.id = this.id
            this.inputs.filter(val => val.link !== null).forEach((val) => {
              // Still need connection to graph inputs and outputs, also [0] garanteed?
              const topic = that.selectedSession.ioMappings.filter(pval => pval.processingModuleId === this.id)[0].inputMappings.filter(io => io.inputName === val.name)[0].topic
              that.debug.active_inputs.push({name: val.name, type: val.type, topic: topic, component: that.dynInComp(val.name, val.type, "in")})
            })

            // that.debug.func = that.selectedSession.processingModules.filter(val => val.id === this.id).map(val => {
            //   return val.onProcessingStringified
            // })[0]
            
            this.outputs.filter(val => val.link !== null).forEach((val) => {
              // Still need connection to graph inputs and outputs, also [0] garanteed?
              const topic = that.selectedSession.ioMappings.filter(pval => pval.processingModuleId === this.id)[0].outputMappings.filter(io => io.outputName === val.name)[0].topic
              that.debug.active_outputs.push({name: val.name, type: val.type, topic: topic, component: that.dynInComp(val.name, val.type, "out")})
            })
            // console.log(that.graph.status)
            if(that.graph.status == 2) that.playGraph();
        }
      },
      node.prototype.onRemoved = function()
      {
        this.deactivatePlay = true
        if(this.id === null) return
        that.removeProcNode({id: this.id},true)
      }

    },
    dynInComp: function (name, type, inOrOut) {

      var ComponentClass = Vue.extend(TopicViewer)
      var instance = new ComponentClass({
            propsData: { name: name, type: type }
        })
      instance.$mount() // pass nothing
      if (inOrOut === "in") {this.$refs.DebugInputs.appendChild(instance.$el)} else {this.$refs.DebugOutputs.appendChild(instance.$el)}
      
      return instance
    },
    registerClientNode: function (clientName, dev, comp) {

      //node constructor class
      function node()
      {
        comp.forEach(c => {
          if (c.ioType == 1)
            this.addInput(c.topic.split("/").pop(), c.messageFormat)
          else
            this.addOutput(c.topic.split("/").pop(), c.messageFormat) 
        })
      }
      // this.properties = { precision: 1 };
      node.title = dev.name
      node.title_color = "#345";
      node.slot_start_y = 40;

      let that = this;
      let latenz = 'NaN';

      node.prototype.onDrawForeground = function(ctx)
      {
        
        latenz = that.latenz.filter(obj => this.id.split(".")[0] === obj.id)[0]
        if (latenz !== undefined) latenz = latenz.latenz+'ms'; else latenz = '' 

        if(this.flags.collapsed)
          return;

        var w = litegraph.LiteGraph.NODE_TITLE_HEIGHT;
        var x = this.size[0] - w;
        ctx.fillStyle = '#fff'
        ctx.fillText(latenz,x,-10)

        
        ctx.fillStyle = "#555";
        ctx.fillRect(0,0,this.size[0],40);
        
        ctx.fillStyle = "#AAA";
        ctx.fillText("Client.ID: "+dev.clientId, 2, 15 );
        ctx.fillText("Dev.ID:    "+dev.id, 2, 30 );
      }


      //function to call when the node is executed
      node.prototype.onExecute = function()
      {
        let o = 0
        for (let i = 0; i < comp.length; i++) {
          if (comp[i].ioType != 1) {this.triggerSlot(o); o++;}
        }
      }

      node.prototype.onRemoved = function()
      {
        this.deactivatePlay = true
        if(this.id === null) return
        that.removeClientNode({id:this.id}, true)
      }

      //register in the system
      litegraph.LiteGraph.registerNodeType("Clients/"+clientName+"/"+dev.name, node)
    },
    addNode: function(name, pos, io, type, id, realName, sessionName, func, procMode, nodeId, sessionId, inputs, outputs) {

      var node_const = litegraph.LiteGraph.createNode(name);
      node_const.id = id
      node_const.pos = pos;
      node_const.name = name

      this.ClSeNodes.push({
            edges: io,
            type: type,
            id: id,
            name: realName,
            func: func,
            procMode: procMode,
            nodeId: nodeId,
            sessionId: sessionId,
            inputs: inputs, 
            outputs: outputs,
            node: node_const,
            sessionName: sessionName
            
          })
      this.graph.add(node_const);
    },
    
    registerProcNodes: async function () {
      this.addProcsList.forEach(proc => {
        
        const sname = (!this.selectedSession)? this.selectedSession.name : this.SessionNameForNew
        this.registerProcessNode(sname, proc, proc.inputs, proc.outputs)
      })
    },
    registerClientNodes: async function () {
      this.addClientsList.forEach(client => {
        this.registerClientNode(client.name, client.device, client.device.components)
      })
    },
    registerGraphTypes: async function (){
      this.registerInputTypes()
      await this.registerClientNodes()
      await this.registerProcNodes()
    },
    loadClientsOfSessionAndIO: async function () {
       
      const clientsDevices = await this.selectedSession.ioMappings.map(val => {
        const inputArray = val.inputMappings.map(val => {
          const sp = val.topic.split('/')
          return sp[1]+'.'+sp[2]
        })
        const outputArray = val.outputMappings.map(val => {
          const sp = val.topic.split('/')
          return sp[1]+'.'+sp[2]
        })
        return [...new Set(inputArray.concat(outputArray))][0]
      })
      await this.loadClients(clientsDevices)
    },
    calcPostions: async function () {
      this.reOrderGraph()
    },
    addProcNodes: async function () {
      this.selectedSession.processingModules.forEach(proc => {
        const io = this.selectedSession.ioMappings.filter(val => proc.id === val.processingModuleId)[0]
        proc.position = [0,0];
        const inputs = proc.inputs
        const outputs = proc.outputs
        //function(name, pos, io, type, id, realName, func, procMode, nodeId, sessionId, inputs, outputs)
        this.addNode("ProcessingModuleClasses/"+proc.sessionId+"/"+proc.name, proc.position, io, 'Proc', proc.id, proc.name, this.selectedSession.name, proc.onProcessingStringified, proc.processingMode, proc.nodeId, proc.sessionId, inputs, outputs)
      })
    },
    addClientNodes: async function () {
      this.clientsOfInterest.forEach(client => {
        client.device.position = [0,0];
        this.addNode("Clients/"+client.name+"/"+client.device.name, client.device.position, client.device.components, 'ClientDevice', client.device.clientId+'.'+client.device.id, client.name + '.' + client.device.name, this.selectedSession.name)
      })
    },
    connectNodes: async function () {
      const c = this.ClSeNodes.filter(val => val.type === 'ClientDevice')
      const s = this.ClSeNodes.filter(val => val.type === 'Proc')
      s.forEach(session => {
        session.edges.inputMappings.forEach((i,index) => {
          const dc = c.filter(val => val.edges.filter(e => e.topic === i.topic))[0]
          if (dc !== null) dc.node.connect(index, session.node, index)
        })
        session.edges.outputMappings.forEach((o,index) => {
          const dc = c.filter(val => val.edges.filter(e => e.topic === o.topic))[0]
          if (dc !== null) session.node.connect(index, dc.node, index)
        })
      })
    },
    showSessionPipeline: async function() {
      await this.clearBeforeRender()
      if(!this.selectedSessionId) return
      await this.loadSession()
      this.addClientsList = cm.writeAllClientDevicesToList(await cm.getAllClients())
      this.addProcsList = await pm.writeAllProcsToList(this.selectedSession)
      await this.registerGraphTypes()
      try {
        await this.loadClientsOfSessionAndIO()
        await this.addClientNodes()
        await this.addProcNodes()
        await this.calcPostions()
        await this.connectNodes()
      } catch (error) {
        // console.log(error)
      }
      // console.log(this.selectedSession)
    },
    removeClientNode: async function (c, fromGraph) {
      console.warn(c)
      const cID = c.id.split('.')[0]+'.'+c.id.split('.')[1]
      let nodeIndex = -1
      this.ClSeNodes.forEach((val,index) => {
        if(val.type === 'ClientDevice' && val.id === cID)
          nodeIndex = index
      })
    
      if (nodeIndex >= 0) {
        const cNode = this.ClSeNodes[nodeIndex].node
        if (!fromGraph) this.graph.remove(cNode)
        this.ClSeNodes.splice(nodeIndex,1)
      }
    },
    removeProcNode: async function (p, fromGraph) {
      const pID = p.id.split('.')[0]
      let nodeIndex = -1

      // console.log(this.ClSeNodes)

      this.ClSeNodes.forEach((val,index) => {
        if(val.type === 'Proc' && val.id === pID)
          nodeIndex = index
      })

      if (nodeIndex >= 0) {
        const cNode = this.ClSeNodes[nodeIndex].node
        if (!fromGraph) this.graph.remove(cNode)
        this.ClSeNodes.splice(nodeIndex,1)
      }
    },
    dragStart:function(proc)  {
      this.draggedObject = proc
    },
    dragging:function() {
    },
    allowDrop:function(event) {
      event.preventDefault();
    },
    drop:function(event) {
      event.preventDefault();
      if(this.draggedObject.client) this.addClientToGraph(this.draggedObject); else this.addProcToGraph(this.draggedObject)
      this.draggedObject = null
    },
    addProcToGraph: function (p) {
      this.deactivatePlay = true
      this.stopGraph()
      const pName = p.name
      // Use filter instead of continue
      this.addProcsList.forEach(proc => {
        if (proc.name !== pName) return
        const id = 'NEW-'+crypto.randomUUID()
        proc.position = [500,500];
        const io = null
        const inputs = proc.inputs
        const outputs = proc.outputs
        const mode = proc.processingMode
        this.addNode("ProcessingModuleClasses/"+proc.sessionId+"/"+proc.name, proc.position, io, 'Proc', id, proc.name, this.selectedSession.name, '', mode, proc.nodeId, proc.sessionId, inputs, outputs)
      })
    },
    addClientToGraph: function (c) {
      const cID = c.id.split('.')[0]+'.'+c.id.split('.')[1]

      let nodeIndex = -1
      this.ClSeNodes.forEach((val,index) => {
        if(val.type === 'ClientDevice' && val.id === cID)
          nodeIndex = index
      })

      if (nodeIndex >= 0) {
        const cNode = this.ClSeNodes[nodeIndex].node
        this.lGraphCanvas.selectNode(cNode)
        return
      }

      // Use filter instead of continue
      this.clientsOfInterest.forEach(client => {
        if (client.id !== c.id) return
        this.deactivatePlay = true
        this.stopGraph()
        this.addNode("Clients/"+client.name+"/"+client.device.name, client.device.position, client.device.components, 'ClientDevice', client.device.clientId+'.'+client.device.id, client.name + '.' + client.device.name, this.selectedSession.name)

      })
    },

    playGraph: async function () {
      this.playActive = true
      this.loadLatenz();
      this.timer = setInterval(function () {
        this.loadLatenz();
      }.bind(this), 10000);

      this.debug.active_inputs.forEach(val => {
        UbiiClientService.instance.unsubscribeTopic(
          val.topic
        );
      })
      this.debug.active_inputs.forEach(val => {
        UbiiClientService.instance.subscribeTopic(
          val.topic,
          (data) => {
            switch(val.type) {
              case 'ubii.dataStructure.Vector2': val.component.ubii_updateVector2(data); break;
              case 'bool': val.component.ubii_updateBool(data); break;
            }  
          }
        );
      })

      this.debug.active_outputs.forEach(val => {
        UbiiClientService.instance.unsubscribeTopic(
          val.topic
        );
      })
      this.debug.active_outputs.forEach(val => {

        UbiiClientService.instance.subscribeTopic(
          val.topic,
          (data) => {
            switch(val.type) {
              case 'ubii.dataStructure.Vector2': val.component.ubii_updateVector2(data); break;
              case 'bool': val.component.ubii_updateBool(data); break;
            }  
          }
        );
      })
      
      this.graph.start();

    },
    stopGraph: async function () {

      this.playActive = false
      clearInterval(this.timer)
      this.debug.active_inputs.forEach(val => {
        UbiiClientService.instance.unsubscribeTopic(
          val.topic
        );
      })

      this.debug.active_outputs.forEach(val => {
        UbiiClientService.instance.unsubscribeTopic(
          val.topic
        );
      })
      this.graph.stop();
    },
    saveGraph: async function () {
      this.deactivatePlay = false
      // console.warn(this.ClSeNodes)
      let session = {
        "id": null,
        "name": null,
        "processingModules": [],
        "ioMappings":[],
        "status":null
      }
      if (this.selectedSession === null) {
        //create new
      } else {
        session.id = this.selectedSession.id
        session.name = this.selectedSession.name
        session.status = this.selectedSession.status
      }
      const procs = this.ClSeNodes.filter(val => val.type === 'Proc')

      procs.forEach(val => {
          const p = {
            "onProcessingStringified": null,
            "name": null,
            "processingMode": {
              "frequency": {
                "hertz": null
              }
            },
            "inputs": [],
            "outputs": [],
            "sessionId": null,
            "nodeId": null,
            "id": null
          }
          p.id = val.id
          p.sessionId = val.sessionId
          p.nodeId = val.nodeId
          p.name = val.name
          p.onProcessingStringified = val.func
          p.processingMode = val.procMode
          p.inputs = val.inputs
          p.outputs = val.outputs

          session.processingModules.push(p)
      })
      procs.forEach(val => {
          const io = this.findIOMappingsOf(val.id, val.node)
          session.ioMappings.push(io)
      })
      console.warn(session)
    },
    findIOMappingsOf: function (procId, node) {

      const inProcLinks = Object.values(node.graph.links).filter(val => procId === val.target_id)
      const outProcLinks = Object.values(node.graph.links).filter(val => procId === val.origin_id) 

      let inputMappings = []
      let outputMappings = []


      inProcLinks.forEach(val => {
        const name = node.inputs[val.target_slot].name
        const topicSource = "topic" // In the next version of Ubii this needs to change
        
        const client = node.graph._nodes.filter(nval => nval.id === val.origin_id)[0]
        const topic = "/"+val.origin_id.split('.')[0]+"/"+client.title+"/"+client.outputs[val.origin_slot].name

        inputMappings.push({
          "inputName": name,
          "topicSource": topicSource,
          "topic": topic 
        })
      })

      outProcLinks.forEach(val => {
        const name = node.outputs[val.origin_slot].name
        const topicSource = "topic" // In the next version of Ubii this needs to change
        
        const client = node.graph._nodes.filter(nval => nval.id === val.target_id)[0]
        const topic = "/"+val.target_id.split('.')[0]+"/"+client.title+"/"+client.inputs[val.target_slot].name

        outputMappings.push({
          "outputName": name,
          "topicDestination": topicSource,
          "topic": topic 
        })
      })


      return {
        "processingModuleName": node.title,
        "inputMappings": inputMappings,
        "outputMappings": outputMappings,
        "processingModuleId": procId
      }

    },
    reOrderGraph: async function () {
      this.lforce = true
      if(this.selected_scene_order === 'ps') {
        if(this.ClSeNodes.length <= 0) {this.lforce = false; return } 
        const list = pc.loadSessionFromLocal(this.selectedSession.name)

        let cs = await this.ClSeNodes.filter(val => val.type === 'ClientDevice')
        let ps = await this.ClSeNodes.filter(val => val.type === 'Proc')

        cs.forEach(val => {
          let found = list.clientNodes.filter(filt => filt.name === val.name)[0]
          if(found) val.node.pos = found.pos
        })

        ps.forEach(val => {
          let found = list.procNodes.filter(filt => filt.name === val.name)[0]
          if(found) val.node.pos = found.pos
        })
        this.graph.setDirtyCanvas(true, true);
        this.lforce = false
      } else if (this.selected_scene_order === 'ls') {
        this.graph.arrange()
        this.lforce = false
      } else if (this.selected_scene_order === 'fs') {
        if(this.ClSeNodes.length <= 0) {this.lforce = false; return } 
        let sim = pc.force(this.graph.links)
        sim.on("end", () => {
            // console.warn(sim.nodes())
            let cs = this.ClSeNodes.filter(val => val.type === 'ClientDevice')
            let ps = this.ClSeNodes.filter(val => val.type === 'Proc')

            cs.forEach(val => {
              let found = sim.nodes().filter(filt => filt.id === val.id)[0]
              if(found) val.node.pos = [found.x, found.y]
            })

            ps.forEach(val => {
              let found = sim.nodes().filter(filt => filt.id === val.id)[0]
              if(found) val.node.pos = [found.x, found.y]
            })
            this.lforce = false
            this.graph.setDirtyCanvas(true, true);
        })
      }
    },
    refresh: async function (CoP) {
      if(CoP === 'clients') {
        this.addClientsList = cm.writeAllClientDevicesToList(await cm.getAllClients())
      } else {
        this.addProcsList = await pm.writeAllProcsToList(this.selectedSession);
      } 
      litegraph.LiteGraph.clearRegisteredTypes()
      this.registerGraphTypes()

    },
    NewSession: async function () {
      console.warn(this.ClSeNodes)

    },
    filterList: async function () {

    },
    saveToLocalStorage: async function () {
      
      let obj = {
        sessionName: this.selectedSession.name,
        clientNodes: [],
        procNodes: [],
      }

      this.ClSeNodes.forEach(val => {
        if(val.type === 'ClientDevice') {
          obj.clientNodes.push({
            name: val.name,
            pos: val.node.pos
          })

        } else {
          obj.procNodes.push({
            name: val.name,
            pos: val.node.pos
          })
        }
      })
      pc.saveSession(obj)
    }
  }
  
}
</script>

<style>

  .dragPos {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  .header-editor {
    border: 1px solid;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .button-editor {
    width: 100%;
    border: 1px solid;
    padding: 5px;
    justify-content: center;
  }

  .vue-treeselect__menu {
    color: black;
  }
</style>