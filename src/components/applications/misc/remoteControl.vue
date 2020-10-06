<template>

  
  <div>
  <!-- Bewegung von G1 (←;→) und T1  --> 
    <header><h1>Remote Control:</h1></header>
    <h3>Steuerung in welche Richtung der Arm zeigen soll:</h3> <br/>
    <div class="grid">
      <div></div>
      <div><button class="btn" style="color: black">↑</button></div> 
      <div></div>
      <div></div>
      <div><button class="btn" style = "color: black">↓</button></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
       <div><button class="btn1" style = "color: black">←</button></div>
      <div></div>
      <div><button class="btn1" style = "color: black">→</button></div>  
      <div></div>
      <div></div>
      <div></div>
      <!-- Bewegung von G2 -->
      <div></div>
      <div><button class="btn2" style="color: black">↑</button></div>
      <div></div>
      <div></div>
      <div><button class="btn2" style = "color: black">↓</button></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <!-- Bewegung von T2 -->
      <div><button class="btn3" style = "color: black">←</button></div>
      <div></div>
      <div><button class="btn3" style = "color: black">→</button></div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import ROSLIB from 'roslib';

export default {
  name: 'RemoteControl',
  data() {
    return {};
  },
  mounted: function() {
    // Create a connection to the rosbridge WebSocket server.
    var ros = new ROSLIB.Ros({
        url: 'ws://131.159.10.80:9090'
    });
    ros.on('connection', function () {
        console.log('Connected to websocket server.');
    });
  }
};
</script>


<style scoped lang="stylus">
.btn{
  height: 50px; 
  width: 75px; 
  color: black;
  margin-top:-5px;
  margin-bottom:10px;
  padding: 5px 3px;

  color: white;
  background-color: #5F9EA0;
  box-shadow: 3px 3px 3px 3px lightblue;
  border: solid 1px #5F9EA0;
  border-radius: 5px;
  font-size:19px;
}
.btn{
  color: yellow;
  transition: ease-in-out all 300ms;
}
.btn:hover{
  background-color: #FFF;
  transform: translate(0px, -3px);
}

.btn1{
  height: 50px; 
  width: 75px; 
  color: black;
  margin-top:-5px;
  margin-bottom:10px;
  padding: 5px 3px;

  color: white;
  background-color: #F3C;
  box-shadow: 3px 3px 3px 3px #F36;
  border: solid 1px #5F9EA0;
  border-radius: 5px;
  font-size:19px;
}
.btn1{
  color: yellow;
  transition: ease-in-out all 300ms;
}
.btn1:hover{
  background-color: #FFF;
  transform: translate(0px, -3px);
}

.btn2{
  height: 50px; 
  width: 75px; 
  color: black;
  margin-top:-5px;
  margin-bottom:10px;
  padding: 5px 3px;

  color: white;
  background-color: #39F;
  box-shadow: 3px 3px 3px 3px #69F;
  border: solid 1px #39C;
  border-radius: 5px;
  font-size:19px;
}
.btn2{
  color: yellow;
  transition: ease-in-out all 300ms;
}
.btn2:hover{
  background-color: #FFF;
  transform: translate(0px, -3px);
}
.btn3{
  height: 50px; 
  width: 75px; 
  color: black;
  margin-top:-5px;
  margin-bottom:10px;
  padding: 5px 3px;

  color: white;
  background-color: #96C;
  box-shadow: 3px 3px 3px 3px #96F;
  border: solid 1px #39C;
  border-radius: 5px;
  font-size:19px;
}
.btn3{
  color: yellow;
  transition: ease-in-out all 300ms;
}
.btn3:hover{
  background-color: #FFF;
  transform: translate(0px, -3px);
}
.grid {
  display: grid;
  grid-template-rows:100px 100px 100px 100px 100px 100px 100px 100px 100px 100px 100px 100px 100px; 
  grid-template-columns:5% 5% 5%; 
}
</style>

