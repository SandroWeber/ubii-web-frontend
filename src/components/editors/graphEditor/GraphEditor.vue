<template>
  <div style="overflow: scroll">
  <Error :alert="trigger" :msg="msg"/>
  <div class="header-editor">
    <span style="padding-right: 5px;">Sessions:</span>
    <treeselect v-model="selectedSessionId" 
      @input="showSessionPipeline()"
      @open="loadOps"
      :load-options="loadOps" 
      :options="availableSessions" 
      :auto-load-root-options="false" 
      :multiple="false" 
      placeholder="Sessions..."/>
  </div>
  <div align="center" class="button-editor">
    <b-button @click="playGraph()" variant="outline-primary" style="margin: 2px;">Play</b-button>
    <b-button @click="stopGraph()" variant="outline-primary" style="margin: 2px;">Stop</b-button>
  </div>
  <div align="center">
    <b-row no-gutters class="flex-nowrap" align="center">
      <b-col cols="5">
        <b-tabs content-class="mt-3" class="ubii-graph-tabs">
          <b-tab title="Clients" active>
            <b-list-group>
              <b-list-group-item variant="dark">Add Clients to the Graph.</b-list-group-item>
              <b-list-group-item variant="dark" v-for="clientDev in addClientsList" :key="clientDev.id">
                <b-card
                  title="Client.Device.Name"
                  bg-variant="dark" 
                  text-variant="white"
                >
                <b-card-text>{{clientDev.id}}.{{clientDev.name}}</b-card-text>
                <div >
                  <b-button @click="addClientToGraph(clientDev)" variant="outline-primary" style="margin: 2px;">Add Client to the Graph</b-button>
                  <b-button @click="removeClientNode(clientDev)" variant="outline-primary" style="margin: 2px;">Remove Client from the Graph</b-button>
                </div>
                </b-card>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
          <b-tab title="Processing Modules">
            <b-list-group>
              <b-list-group-item variant="dark">Add Processing Modules to the Graph.</b-list-group-item>
              <b-list-group-item variant="dark" v-for="proc in addProcsList" :key="proc.id">
                <b-card
                  title="Processing Module Name"
                  bg-variant="dark" 
                  text-variant="white"
                >
                <b-card-text>{{proc.id}}.{{proc.name}}</b-card-text>
                <div >
                  <b-button @click="addProcToGraph(proc)" variant="outline-primary" style="margin: 2px;">Add PM the Graph</b-button>
                  <b-button @click="removeProcNode(proc)" variant="outline-primary" style="margin: 2px;">Remove PM from the Graph</b-button>
                </div>
                </b-card>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
          <b-tab title="Debug">
            <b-container class="debug-row">
              <b-row id="dIn" ref="DebugInputs" class="flex-nowrap justify-left" style="border: 1px solid; overflow: auto; padding: 1em"> 
              </b-row>
              <b-row id="dOut" ref="DebugOutputs" class="flex-nowrap justify-left" style="border: 1px solid; overflow: auto; padding: 1em"> 
              </b-row>
              <b-row style="border: 1px solid">
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
                      <b-form-textarea
                        id="textarea-auto-height"
                        rows="3"
                        max-rows="8"
                        v-model="debug.func"
                        overflow-x:scroll
                      ></b-form-textarea>
                    </b-card>
                  </div>
                </b-col>
              </b-row>
            </b-container>
          </b-tab>
        </b-tabs>
      </b-col><b-col>
      <canvas id="canvas" class='litegraph' width='1024' height='720' style='border: 1px solid;'></canvas>
      </b-col>
    </b-row>
  </div>
  </div>
</template>
<script>

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

export default {
  name: "LiteGraph",
  components: {
    Treeselect,
    Error
  },
  data() {
    return {
      outputContext: null,
      context: null,
      graph: null,
      lGraphCanvas: null,

      trigger: 0,
      msg: '',

      selectedSessionId: null,
      selectedSession: null,
      availableSessions: null,

      clientsOfInterest: null,

      addClientsList: [],
      addProcsList: [],

      latenz: [],
      timer: null,


      ClSeNodes: [],
      debug: { 
        id: null,
        active_inputs: [],
        func: null,
        active_outputs: []
      }
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
      this.addProcsList = []
      this.latenz = []
      this.$refs.DebugInputs.innerHTML = ''
      this.$refs.DebugOutputs.innerHTML = ''
      this.debug = {
        id: null,
        active_inputs: [],
        func: null,
        active_outputs: []
      }
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
      
      this.clientsOfInterest.filter(val => val.state === 0).forEach(client => {
        client.devices.forEach(dev => {
          this.addClientsList.push(
            {
              id: dev.clientId+'.'+dev.id,
              name: dev.name
            }
          )
        })
      })
    },
    addProcsToList: async function() {
      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.PM_DATABASE_GET_LIST)
      const pList = res.processingModuleList.elements

      this.addProcsList = pList.filter(val => val.sessionId === this.selectedSession.id)
      // console.log(this.addProcsList)
    },
    loadLatenz: async function() {
      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.LATENZ_CLIENTS_LIST)
      this.latenz = res.clientList.elements
    },
    loadSession: async function () {
      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_GET_LIST)
      const sList = res.sessionList.elements
      // console.log('Session:', sList)
      try { 
        this.selectedSession = sList.filter(val => val.status === 1 && this.selectedSessionId == val.id)[0]
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
      const res = await this.ubiiGetResult(DEFAULT_TOPICS.SERVICES.CLIENT_GET_LIST)
      const sList = res.clientList.elements
 
      const clientFilts = filts.map(val => {
        return val.split('.')[0]
      })

      const deviceFilts = filts.map(val => {
        return val.split('.')[1]
      })

      try {
        this.clientsOfInterest = sList.filter(val => val.state === 0 && clientFilts.includes(val.id))
        this.clientsOfInterest.forEach(client => {
          client.devices = client.devices.filter(val => deviceFilts.includes(val.name))
        })
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
        this.size = [140, 80];
  
        inp.forEach(i => {
          this.addInput(i.internalName, i.messageFormat)
        })
        out.forEach(o => {
          this.addOutput(o.internalName, o.messageFormat)
        })

      }
      node.title = proc.name
      node.title_color = "#243";
      node.slot_start_y = 20;
      
      let that = this
      
      node.prototype.onDrawForeground = function(ctx)
      {
        this.size[0] = 400
        if(this.flags.collapsed)
          return;
        ctx.fillStyle = "#555";
        ctx.fillRect(0,0,this.size[0],20);
        
        ctx.fillStyle = "#AAA";
        ctx.fillText("Proc.ID: "+proc.id, 2, 15 );
      }


      //function to call when the node is executed
      node.prototype.onExecute = function()
      {
        out.forEach((_,i) => {
          this.triggerSlot(i)
        })
      }

      litegraph.LiteGraph.registerNodeType("Sessions/"+sname+"/"+proc.name, node)
      
      node.prototype.onDrawTitle = function(ctx) {
        if (this.flags.collapsed) {
            return;
        }

        ctx.fillStyle = "#555";
        var w = litegraph.LiteGraph.NODE_TITLE_HEIGHT;
        var x = this.size[0] - w;
        ctx.fillRect(x, -w, w, w);
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, -w * 0.6);
        ctx.lineTo(x + w * 0.8, -w * 0.6);
        ctx.lineTo(x + w * 0.5, -w * 0.3);
        ctx.fill();
      };

      node.prototype.onConnectionsChange = function(inOrOut, slot, state, link_info, input_info) {
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
          // play? active?
          //
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

            that.debug.func = that.selectedSession.processingModules.filter(val => val.id === this.id).map(val => {
              return val.onProcessingStringified
            })[0]
            
            this.outputs.filter(val => val.link !== null).forEach((val) => {
              // Still need connection to graph inputs and outputs, also [0] garanteed?
              const topic = that.selectedSession.ioMappings.filter(pval => pval.processingModuleId === this.id)[0].outputMappings.filter(io => io.outputName === val.name)[0].topic
              that.debug.active_outputs.push({name: val.name, type: val.type, topic: topic, component: that.dynInComp(val.name, val.type, "out")})
            })
            // console.log(that.graph.status)
            if(that.graph.status == 2) that.playGraph();

        }
      };

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
        if (latenz !== undefined) latenz = latenz.latenz+'ms'; else latenz = 'NaN' 


        var w = litegraph.LiteGraph.NODE_TITLE_HEIGHT;
        var x = this.size[0] - w;
        ctx.fillStyle = '#fff'
        ctx.fillText(latenz,x,-8)


        if(this.flags.collapsed)
          return;
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

      //register in the system
      litegraph.LiteGraph.registerNodeType("Clients/"+clientName+"/"+dev.name, node)
    },
    addNode: function(name, pos, io, type, id) {

      var node_const = litegraph.LiteGraph.createNode(name);
      node_const.id = id
      node_const.pos = pos;
      this.ClSeNodes.push({
            id: id,
            type: type,
            edges: io,
            node: node_const
          })
      this.graph.add(node_const);
    },
    
    registerProcNodesOfSession: async function () {
      if (!this.selectedSession.processingModules || this.selectedSession.processingModules.length === 0) throw 'Session has no processing modules.'
      this.selectedSession.processingModules.forEach(proc => {
        // console.log(proc)
        this.registerProcessNode(this.selectedSession.name, proc, proc.inputs, proc.outputs)
      })
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
    
    registerClientNodes: async function () {
      this.clientsOfInterest.forEach(client => {
        client.devices.forEach(device => {
          this.registerClientNode(client.name, device, device.components)
        })
      })
    },
    calcPostions: async function () {
      // console.log('TODO CALC POSITIONS')
    },
    addProcNodes: async function () {
      this.selectedSession.processingModules.forEach(proc => {
        const io = this.selectedSession.ioMappings.filter(val => proc.id === val.processingModuleId)[0]
        proc.position = [600,200];
        this.addNode("Sessions/"+this.selectedSession.name+"/"+proc.name, proc.position, io, 'Proc', proc.id )
      })
    },
    addClientNodes: async function () {
      this.clientsOfInterest.forEach(client => {
        client.devices.forEach(device => {
          device.position = [200,200];
          this.addNode("Clients/"+client.name+"/"+device.name, device.position, device.components, 'ClientDevice', device.clientId+'.'+device.id)
        })
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
      this.registerInputTypes()
      if(!this.selectedSessionId) return
      await this.loadSession()
      try {
        await this.registerProcNodesOfSession()
        await this.loadClientsOfSessionAndIO()
        await this.registerClientNodes()
        await this.addClientsToList()
        await this.addProcsToList()
        await this.calcPostions()
        await this.addClientNodes()
        await this.addProcNodes()
        await this.connectNodes()
        this.loadLatenz();
        this.timer = setInterval(function () {
          this.loadLatenz();
        }.bind(this), 10000); 

      } catch (error) {
        // console.log(error)
      }
      
      // console.log(this.selectedSession)
    },
    removeClientNode: async function (c) {
      const cID = c.id.split('.')[0]+'.'+c.id.split('.')[1]
      let nodeIndex = -1
      this.ClSeNodes.forEach((val,index) => {
        if(val.type === 'ClientDevice' && val.id === cID)
          nodeIndex = index
      })
    
      if (nodeIndex >= 0) {
        const cNode = this.ClSeNodes[nodeIndex].node
        this.graph.remove(cNode)
        this.ClSeNodes.splice(nodeIndex,1)
      }
    },
    removeProcNode: async function (p) {
      const pID = p.id.split('.')[0]
      let nodeIndex = -1

      // console.log(this.ClSeNodes)

      this.ClSeNodes.forEach((val,index) => {
        if(val.type === 'Proc' && val.id === pID)
          nodeIndex = index
      })

      if (nodeIndex >= 0) {
        const cNode = this.ClSeNodes[nodeIndex].node
        this.graph.remove(cNode)
        this.ClSeNodes.splice(nodeIndex,1)
      }
    },
    addProcToGraph: function (p) {
      const pID = p.id.split('.')[0]
      let nodeIndex = -1

      this.ClSeNodes.forEach((val,index) => {
        if(val.type === 'Proc' && val.id === pID)
          nodeIndex = index
      })

      if (nodeIndex >= 0) {
        const cNode = this.ClSeNodes[nodeIndex].node
        this.lGraphCanvas.selectNode(cNode)
        return
      }
      // Use filter instead of continue
      this.addProcsList.forEach(proc => {
        if (proc.id !== pID) return
        const io = this.selectedSession.ioMappings.filter(val => proc.id === val.processingModuleId)[0]
        proc.position = [600,200];
        this.addNode("Sessions/"+this.selectedSession.name+"/"+proc.name, proc.position, io, 'Proc', proc.id )
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
        if (client.id !== c.id.split('.')[0]) return
        
        client.devices.forEach(device => {
          if (device.id !== c.id.split('.')[1]) return
          
          device.position = [200,200];
          this.addNode("Clients/"+client.name+"/"+device.name, device.position, device.components, 'ClientDevice', device.clientId+'.'+device.id)
        })
      })
    },

    playGraph: async function () {
      // this.ws.onMessageReceived(this.wsCallback)
      // const enc = new TextEncoder();
      // this.ws.send(enc.encode("PING"))
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
    }
  }
  
}
</script>

<style>
  .header-editor {
    border: 1px solid;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .button-editor {
    border: 1px solid;
    padding: 5px;
    justify-content: center;
  }

  .vue-treeselect__menu {
    color: black;
  }
</style>