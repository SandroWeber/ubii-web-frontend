<template>
  <div>
    <!-- Bewegung von G1 (←;→) und T1  -->
    <header><h1>Remote Control:</h1></header>
    <h3>Steuerung des Roboterarms:</h3>
    <br />
    <div class="grid">
      <div></div>
      <div>
        <button
          class="btn"
          style="color: black"
          @click="rotateJoint(4, 'right')"
        >
          ↑
        </button>
      </div>
      <div></div>
      <div></div>
      <div>
        <button
          class="btn"
          style="color: black"
          @click="rotateJoint(4, 'left')"
        >
          ↓
        </button>
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div>
        <button
          class="btn1"
          style="color: black"
          @click="rotateJoint(2, 'right')"
        >
          ↑
        </button>
      </div>
      <div></div>
      <div></div>
      <div>
        <button
          class="btn1"
          style="color: black"
          @click="rotateJoint(2, 'left')"
        >
          ↓
        </button>
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div>
        <button
          class="btn2"
          style="color: black"
          @click="rotateJoint(3, 'left')"
        >
          ←
        </button>
      </div>
      <div></div>
      <div>
        <button
          class="btn2"
          style="color: black"
          @click="rotateJoint(3, 'right')"
        >
          →
        </button>
      </div>
      <div></div>
      <div></div>
      <div></div>
      <!-- Bewegung von G2 -->
      <div></div>
      <div>
        <button
          class="btn3"
          style="color: black"
          @click="rotateJoint(1, 'left')"
        >
          ↑
        </button>
      </div>
      <div></div>
      <div></div>
      <div>
        <button
          class="btn3"
          style="color: black"
          @click="rotateJoint(1, 'right')"
        >
          ↓
        </button>
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <!-- Bewegung von T2 -->
      <div>
        <button
          class="btn4"
          style="color: black"
          @click="rotateJoint(0, 'left')"
        >
          ←
        </button>
      </div>
      <div></div>
      <div>
        <button
          class="btn4"
          style="color: black"
          @click="rotateJoint(0, 'right')"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */

import ROSLIB from 'roslib';

let createJointCommandTopics = ros => {
  let jointTopics = [];
  for (let i = 1; i <= 7; i++) {
    jointTopics.push(
      new ROSLIB.Topic({
        ros: ros,
        name: '/robot/arm_' + i + '_joint/cmd_pos',
        messageType: 'std_msgs/Float64'
      })
    );
  }

  return jointTopics;
};

let createJointServices = ros => {
  let services = [];
  for (let i = 1; i <= 6; i++) {
    services.push(
      new ROSLIB.Service({
        ros: ros,
        name: '/robot/arm_' + i + '_joint/get_target',
        serviceType: 'gazebo_msgs/GetJointStates'
      })
    );
  }

  return services;
};

let getAngle = jointService => {
  return new Promise((resolve, reject) => {
    var request = new ROSLIB.ServiceRequest({});

    jointService.callService(request, result => {
      resolve(result);
    });
  });
};

export default {
  name: 'RemoteControl',
  data() {
    return {};
  },
  mounted: function() {
    // Create a connection to the rosbridge WebSocket server.
    this.ros = new ROSLIB.Ros({
      url: 'ws://localhost:9090'
    });
    this.ros.on('connection', function() {
      console.log('Connected to websocket server.');
    });

    this.jointCommandTopics = createJointCommandTopics(this.ros);
    this.jointServices = createJointServices(this.ros);

    this.currentAngles = [];
    this.jointServices.forEach(async service => {
      let response = await getAngle(service);
      this.currentAngles.push(response.value[0]);
    });
  },
  methods: {
    publishAngle: function(jointIndex, angle) {
      let topic = this.jointCommandTopics[jointIndex];
      var message = new ROSLIB.Message({
        data: angle
      });
      topic.publish(message);
    },
    rotateJoint: function(jointIndex, direction) {
      if (direction === 'left' || direction === 'up') {
        this.currentAngles[jointIndex] += 0.1;
      } else if (direction === 'right') {
        this.currentAngles[jointIndex] -= 0.1;
      }
      //console.info(this.currentAngles[jointIndex]);
      this.publishAngle(jointIndex, this.currentAngles[jointIndex]);
    }
  }
};
</script>


<style scoped>
.btn {
  height: 50px;
  width: 75px;
  color: black;
  margin-top: 0px;
  margin-bottom: 10px;
  padding: 5px 3px;
  color: white;
  background-color: #5f9ea0;
  box-shadow: 3px 3px 3px 3px lightblue;
  border: solid 1px #5f9ea0;
  border-radius: 5px;
  font-size: 19px;
}

.btn {
  transition: ease-in-out all 300ms;
}

.btn:hover {
  background-color: #fff;
  transform: translate(0px, -3px);
}

.btn1 {
  height: 50px;
  width: 75px;
  color: black;
  margin-top: -5px;
  margin-bottom: 10px;
  padding: 5px 3px;
  color: white;
  background-color: #f3c;
  box-shadow: 3px 3px 3px 3px #f36;
  border: solid 1px #eb67a5;
  border-radius: 5px;
  font-size: 19px;
}

.btn1 {
  transition: ease-in-out all 300ms;
}

.btn1:hover {
  background-color: #fff;
  transform: translate(0px, -3px);
}

.btn2 {
  height: 50px;
  width: 75px;
  color: black;
  margin-top: -5px;
  margin-bottom: 10px;
  padding: 5px 3px;
  color: white;
  background-color: #39f;
  box-shadow: 3px 3px 3px 3px #69f;
  border: solid 1px #39c;
  border-radius: 5px;
  font-size: 19px;
}

.btn2 {
  transition: ease-in-out all 300ms;
}

.btn2:hover {
  background-color: #fff;
  transform: translate(0px, -3px);
}

.btn3 {
  height: 50px;
  width: 75px;
  color: black;
  margin-top: -5px;
  margin-bottom: 10px;
  padding: 5px 3px;
  color: white;
  background-color: #96c;
  box-shadow: 3px 3px 3px 3px rgb(144, 92, 247);
  border: solid 1px rgb(177, 137, 204);
  border-radius: 5px;
  font-size: 19px;
}

.btn3 {
  transition: ease-in-out all 300ms;
}

.btn3:hover {
  background-color: #fff;
  transform: translate(0px, -3px);
}

.btn4 {
  height: 50px;
  width: 75px;
  color: black;
  margin-top: 0px;
  margin-bottom: 10px;
  padding: 5px 3px;
  color: white;
  background-color: yellowgreen;
  box-shadow: 3px 3px 3px 3px yellow;
  border: solid 1px yellowgreen;
  border-radius: 5px;
  font-size: 19px;
}

.btn4 {
  transition: ease-in-out all 300ms;
}

.btn4:hover {
  background-color: #fff;
  transform: translate(0px, -3px);
}
.grid {
  display: grid;
  grid-template-rows: repeat(13, minmax(50px, 1fr));
  grid-template-columns: 5% 5% 5%;
  overflow: auto;
  padding: 10px;
}
</style>

