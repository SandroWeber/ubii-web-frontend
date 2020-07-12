<template>
  <UbiiClientContent :ubiiClientService="ubiiClientService">
    <div ref="top-div">
      <br />
      <div class="c">
        Myo connected:
        <font-awesome-icon
          id="connect-icon"
          :icon="connectedIcon"
          class="interface-icon"
        />
        <p v-if="!myoConnected">
          Do you have the Myo SDK installed? (only available for Windows/Mac)
        </p>
      </div>
      <table class="sturdy">
        <tr>
          <th>Datatype</th>
          <th colspan="8">Client-Data</th>
        </tr>
        <tr>
          <th>EMG</th>
          <td>{{ this.round(myoData.emg.v0, 1) }}</td>
          <td>{{ this.round(myoData.emg.v1, 1) }}</td>
          <td>{{ this.round(myoData.emg.v2, 1) }}</td>
          <td>{{ this.round(myoData.emg.v3, 1) }}</td>
          <td>{{ this.round(myoData.emg.v4, 1) }}</td>
          <td>{{ this.round(myoData.emg.v5, 1) }}</td>
          <td>{{ this.round(myoData.emg.v6, 1) }}</td>
          <td>{{ this.round(myoData.emg.v7, 1) }}</td>
        </tr>
        <tr>
          <th>Orientation</th>
          <td colspan="2">{{ this.round(myoData.orientation.x, 1) }}</td>
          <td colspan="2">{{ this.round(myoData.orientation.y, 1) }}</td>
          <td colspan="2">{{ this.round(myoData.orientation.z, 1) }}</td>
          <td colspan="2">{{ this.round(myoData.orientation.w, 1) }}</td>
        </tr>
        <tr>
          <th>Gyroscope</th>
          <td colspan="3">{{ this.round(myoData.gyroscope.x, 1) }}</td>
          <td colspan="3">{{ this.round(myoData.gyroscope.y, 1) }}</td>
          <td colspan="2">{{ this.round(myoData.gyroscope.z, 1) }}</td>
        </tr>
        <tr>
          <th>Accelerometer</th>
          <td colspan="3">{{ this.round(myoData.accelerometer.x, 1) }}</td>
          <td colspan="3">{{ this.round(myoData.accelerometer.y, 1) }}</td>
          <td colspan="2">{{ this.round(myoData.accelerometer.z, 1) }}</td>
        </tr>
        <tr>
          <th>Gesture</th>
          <td colspan="8">{{ gestureToString(myoData.gesture) }}</td>
        </tr>
      </table>
    </div>
  </UbiiClientContent>
</template>

<script>
import Myo from 'myo';

import UbiiClientContent from '../applications/sharedModules/UbiiClientContent';
import UbiiEventBus from '../../services/ubiiClient/ubiiEventBus';

import UbiiClientService from '../../services/ubiiClient/ubiiClientService.js';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

/* fontawesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

library.add(faCheckCircle);
library.add(faTimesCircle);

export default {
  name: 'Interface-Myo',
  components: { UbiiClientContent },

  mounted: function() {
    // unsubscribe before page is unloaded
    window.addEventListener('beforeunload', () => {
      this.stopInterface();
    });

    UbiiEventBus.$on(UbiiEventBus.CONNECT_EVENT, () => {
      this.stopInterface();
      this.startInterface();
    });
    UbiiEventBus.$on(UbiiEventBus.DISCONNECT_EVENT, this.stopInterface);

    if (UbiiClientService.isConnected) this.startInterface();
  },

  beforeDestroy: function() {
    this.stopInterface();
  },

  data: () => {
    return {
      //ubi-related
      ubiiClientService: UbiiClientService,
      interfaceStarted: false,

      pollingInterval: null,
      myoConnected: false,
      connectedIcon: faTimesCircle,

      myoData: {
        emg: { v0: 0, v1: 0, v2: 0, v3: 0, v4: 0, v5: 0, v6: 0, v7: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 0 },
        gyroscope: { x: 0, y: 0, z: 0 },
        accelerometer: { x: 0, y: 0, z: 0 },
        gesture: 0
      },
      rpsGesture: 0
    };
  },

  watch: {
    myoConnected: function(status) {
      var icon = document.getElementById('connect-icon');
      if (status) {
        icon.style.color = '#A9DC76';
        this.connectedIcon = faCheckCircle;
      } else {
        icon.style.color = '#FF6188';
        this.connectedIcon = faTimesCircle;
      }
    }
  },

  methods: {
    //create specifications for the protobuf messages
    createUbiiSpecs: function() {
      //helper definitions that we can reference later
      let deviceName = 'web-interface-myo';
      let topicPrefix = UbiiClientService.getClientID() + '/' + deviceName;
      let inputClientMyoData = {
        internalName: 'myoData',
        messageFormat: 'ubii.dataStructure.MyoEvent',
        topic: topicPrefix + '/' + 'myo_data'
      };

      //specification of a ubii.devices.Device
      let ubiiDevice = {
        name: deviceName,
        deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
        components: [
          {
            topic: inputClientMyoData.topic,
            messageFormat: inputClientMyoData.messageFormat,
            ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
          }
        ]
      };

      // assign to local state for future reference
      this.$data.deviceName = deviceName;
      this.$data.ubiiDevice = ubiiDevice;
      this.$data.inputClientMyoData = inputClientMyoData;
    },

    startInterface: function() {
      UbiiClientService.isConnected().then(() => {
        // create all the specifications
        this.createUbiiSpecs();

        //Myo setup
        this.connectMyo();
        this.getMyoData();
        this.setPublishInterval();

        // register device
        UbiiClientService.registerDevice(this.$data.ubiiDevice)
          .then(device => {
            this.$data.ubiiDevice = device;
            return device;
          })
          .then(() => {
            this.$data.interfaceStarted = true;
          });
      });
    },

    stopInterface: function() {
      if (!this.interfaceStarted) return;
      this.interfaceStarted = false;

      //disconnect Myo
      clearInterval(this.$data.pollingInterval);
      this.disconnectMyo();
      this.$data.myoConnected = false;
    },

    //round values for better display
    round: function(value, digits) {
      return Math.round(value * digits * 10) / (digits * 10);
    },

    //connect myo and enable emg stream
    connectMyo: function() {
      Myo.connect('com.ubii.myoInterface');

      Myo.on('connected', function() {
        this.streamEMG(true);
      });
    },

    //publish data every 10ms
    setPublishInterval: function() {
      this.pollingInterval = setInterval(() => this.publishMyoData(), 10);
    },

    //publish data
    publishMyoData: function() {
      if (!this.$data.myoConnected) return;

      UbiiClientService.publishRecord({
        topic: this.$data.inputClientMyoData.topic,
        myoEvent: this.$data.myoData
      });
    },

    //Disable all event listeners and disconnect
    disconnectMyo: function() {
      Myo.off('emg');
      Myo.off('imu');
      Myo.off('pose');
      Myo.off('pose_off');
      this.$data.myoConnected = false;
      Myo.disconnect();
    },

    //Set up all event listeners
    getMyoData: function() {
      Myo.on('imu', data => {
        this.$data.myoConnected = true;

        this.$data.myoData.orientation = {
          x: data.orientation.x,
          y: data.orientation.y,
          z: data.orientation.z,
          w: data.orientation.w
        };
        this.$data.myoData.gyroscope = {
          x: data.gyroscope.x,
          y: data.gyroscope.y,
          z: data.gyroscope.z
        };
        this.$data.myoData.accelerometer = {
          x: data.accelerometer.x,
          y: data.accelerometer.y,
          z: data.accelerometer.z
        };
      });

      Myo.on('emg', data => {
        this.$data.myoConnected = true;
        this.$data.myoData.emg = {
          v0: data[0],
          v1: data[1],
          v2: data[2],
          v3: data[3],
          v4: data[4],
          v5: data[5],
          v6: data[6],
          v7: data[7]
        };
      });

      Myo.on('pose', data => {
        this.$data.myoConnected = true;
        var e;
        switch (data) {
          case 'fingers_spread':
            e = 1;
            break;
          case 'wave_in':
            e = 2;
            break;
          case 'wave_out':
            e = 3;
            break;
          case 'fist':
            e = 4;
            break;
          case 'double_tap':
            e = 5;
            break;
          default:
            e = 0;
        }
        this.$data.myoData.gesture = e;
      });

      Myo.on('pose_off', () => {
        this.$data.myoData.gesture = 0;
      });

      Myo.on('connected', () => {
        this.$data.myoConnected = true;
      });

      Myo.on('disconnected', () => {
        this.$data.myoConnected = false;
      });
    },

    //print gesture name
    gestureToString: function(g) {
      switch (g) {
        case 1:
          return 'fingers spread';
        case 2:
          return 'wave in';
        case 3:
          return 'wave out';
        case 4:
          return 'fist';
        case 5:
          return 'double tap';
        default:
          return 'rest';
      }
    }
  }
};
</script>

<style scoped lang="stylus">
div.c {
  text-align: center;
}

.interface-icon {
  vertical-align: text-top;
  color: redAccentColor;
}

table {
  margin: 15px 0;
  table-layout: fixed;
  width: 420px;
  margin-left: auto;
  margin-right: auto;
}

table, th, td {
  border-collapse: collapse;
  padding: 8px;
}

td {
  text-align: right;
  background-color: layerTwoSecondaryColor;
  border-bottom: 1px solid layerOneSecondaryColor;
}

th {
  text-align: left;
  background-color: layerThreeSecondaryColor;
  border-bottom: 1px solid layerTwoSecondaryColor;
}

.sturdy tr:first-child th:first-child {
  border-top-left-radius: 8px;
  border-right: 1px solid layerTwoSecondaryColor;
}

.sturdy tr:first-child th:last-child {
  border-top-right-radius: 8px;
}

.sturdy tr:first-child {
  color: orangeAccentColor;
}

.sturdy tr:last-child th:first-child {
  border-bottom-left-radius: 8px;
}

.sturdy tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

.sturdy th:nth-child(1) {
  width: 32%;
}

.sturdy td:nth-child(2), .sturdy td:nth-child(3), .sturdy td:nth-child(4), .sturdy td:nth-child(5), .sturdy td:nth-child(6), .sturdy td:nth-child(7), .sturdy td:nth-child(8), .sturdy td:nth-child(9), .sturdy td:nth-child(10), .sturdy td:nth-child(11), .sturdy td:nth-child(12), .sturdy td:nth-child(13), .sturdy td:nth-child(14), .sturdy td:nth-child(15), .sturdy td:nth-child(16), .sturdy td:nth-child(17) {
  width: 5%;
}
</style>
