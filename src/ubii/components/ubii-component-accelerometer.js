import { proto } from '@tum-far/ubii-msg-formats';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiComponent from './ubii-component-base';

const UBII_SPECS = {
  name: 'web-component-linear-acceleration',
  tags: ['acceleration', 'linear'],
  messageFormat: 'ubii.dataStructure.Vector3',
  ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
  description: 'web interface - smart device - accelerometer component'
};

export default class UbiiComponentAccelerometer extends UbiiComponent {
  constructor(publishFrequencyMS) {
    super(UBII_SPECS);

    this.publishFrequencyMS = publishFrequencyMS;

    this.accelDataLowerThreshold = 0.2;
    this.accelRingbuffer = [];
    this.accelRingbufferSize = 10;
    this.accelRingbufferSizeInMS = 100000;
    this.accelRingbufferPos = 0;
    this.velocityPrincipalDirectionMagnitudeThreshold = 30;
    this.velocityPrincipalDirectionMinDifference = 10;

    this.deviceData = {};
  }

  onStart() {
    this.registerEventListeners();
    this.continuousPublishing();
  }

  onStop() {
    this.unregisterEventListeners();
  }

  calibrate() {
    if (this.currentAcceleration) {
      this.calibratedAcceleration = this.currentAcceleration;
    }
  }

  /* event callbacks */

  registerEventListeners() {
    this.cbOnDeviceMotion = this.onDeviceMotion.bind(this);
    window.addEventListener('devicemotion', this.cbOnDeviceMotion, true);
  }

  unregisterEventListeners() {
    this.cbOnDeviceMotion && window.removeEventListener('devicemotion', this.cbOnDeviceMotion);
  }

  onDeviceMotion(event) {
    if (!this.deviceMotionInitialized) {
      // adjust publishing frequency if API frequency is lower
      if (event.interval && event.interval > this.publishIntervalMilliseconds) {
        this.publishIntervalMilliseconds = event.interval;
        this.accelRingbufferSize = this.accelRingbufferSizeInMS / event.interval;
      } else {
        this.accelRingbufferSize = this.accelRingbufferSizeInMS / this.publishIntervalMilliseconds;
      }

      this.deviceMotionInitialized = true;
      return;
    }

    /*this.processAccelerationData(event.acceleration);
    if (this.componentTouch && this.componentTouch.touches && this.componentTouch.touches.length > 0) {
      let vel = this.velocityEstimate();
      console.info(event.acceleration);
      console.info(vel);
      console.info(this.getVelocityPrincipalDirection(vel));
    }*/

    // https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
    let timestamp = UbiiClientService.instance.generateTimestamp();
    this.deviceData.accelerationData = {
      acceleration: event.acceleration,
      timestamp: timestamp
    };
    this.deviceData.rotationRate = {
      rotationRate: event.rotationRate,
      timestamp: timestamp
    };
  }

  processAccelerationData(acceleration) {
    // thresholding
    let data = {
      x: Math.abs(acceleration.x) > this.accelDataLowerThreshold ? acceleration.x : 0,
      y: Math.abs(acceleration.y) > this.accelDataLowerThreshold ? acceleration.y : 0,
      z: Math.abs(acceleration.z) > this.accelDataLowerThreshold ? acceleration.z : 0
    };
    if (this.accelRingbuffer.length === this.accelRingbufferSize) {
      this.accelRingbuffer[this.accelRingbufferPos] = data;
    } else {
      this.accelRingbuffer.push(data);
    }
    this.accelRingbufferPos = (this.accelRingbufferPos + 1) % this.accelRingbufferSize;

    return data;
  }

  velocityEstimate() {
    let summed = { x: 0, y: 0, z: 0 };
    for (let element of this.accelRingbuffer) {
      summed.x += element.x;
      summed.y += element.y;
      summed.z += element.z;
    }

    return summed;
  }

  getVelocityPrincipalDirection(velocityEstimate) {
    let absVelX = Math.abs(velocityEstimate.x),
      absVelY = Math.abs(velocityEstimate.y),
      absVelZ = Math.abs(velocityEstimate.z);
    let magnitude = absVelX + absVelY + absVelZ;
    if (magnitude > this.velocityPrincipalDirectionMagnitudeThreshold) {
      // at least activity above threshold
      // find biggest component (in absolute terms) that has threshold distance to other components
      let diffXY = absVelX - absVelY;
      let diffXZ = absVelX - absVelZ;
      let diffYZ = absVelY - absVelZ;

      if (
        diffXY > this.velocityPrincipalDirectionMinDifference &&
        diffXZ > this.velocityPrincipalDirectionMinDifference
      ) {
        return Math.sign(velocityEstimate.x) + 'X';
      } else if (
        diffXY < -this.velocityPrincipalDirectionMinDifference &&
        diffYZ > this.velocityPrincipalDirectionMinDifference
      ) {
        return Math.sign(velocityEstimate.y) + 'Y';
      } else if (
        diffXZ < -this.velocityPrincipalDirectionMinDifference &&
        diffYZ < -this.velocityPrincipalDirectionMinDifference
      ) {
        return Math.sign(velocityEstimate.z) + 'Z';
      } else {
        return 'None';
      }
    } else {
      return 'None';
    }
  }

  /* topic communication */

  async continuousPublishing() {
    this.publishDeviceMotion();

    if (this.running) {
      setTimeout(() => {
        this.continuousPublishing();
      }, this.publishFrequencyMS);
    }
  }

  publishDeviceMotion() {
    if (!this.deviceData || !this.deviceData.accelerationData) {
      //console.info('no device or acceleration data');
      return;
    }

    UbiiClientService.instance.publishRecord({
      topic: this.topic,
      timestamp: this.deviceData.accelerationData.timestamp,
      vector3: {
        x: this.deviceData.accelerationData.acceleration.x,
        y: this.deviceData.accelerationData.acceleration.y,
        z: this.deviceData.accelerationData.acceleration.z
      }
    });
  }

  /* helper functions */
}
