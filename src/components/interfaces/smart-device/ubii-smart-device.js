import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import UbiiComponentTouchscreen from '../../../ubii/components/ubii-component-touch';
import UbiiComponentOrientation from '../../../ubii/components/ubii-component-orientation';
import UbiiComponentVibration from '../../../ubii/components/ubii-component-vibration';

const PLACEHOLDER_TOPIC_PREFIX = '<placeholder-topic-prefix>';
const UBII_SPECS_TEMPLATE = {
  name: 'web-interface-smart-device',
  tags: ['smart device', 'web interface'],
  deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
  components: [
    {
      topic: PLACEHOLDER_TOPIC_PREFIX + '/linear_acceleration',
      messageFormat: 'ubii.dataStructure.Vector3',
      ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
    }
  ]
};

export default class UbiiSmartDevice {
  constructor(elementTouch) {
    Object.assign(this, UBII_SPECS_TEMPLATE);
    this.deviceData = {};
    this.publishIntervalMilliseconds = 200;
    this.elementTouch = elementTouch;

    this.accelDataLowerThreshold = 0.2;
    this.accelRingbuffer = [];
    this.accelRingbufferSize = 10;
    this.accelRingbufferSizeInMS = 100000;
    this.accelRingbufferPos = 0;
    this.velocityPrincipalDirectionMagnitudeThreshold = 30;
    this.velocityPrincipalDirectionMinDifference = 10;
  }

  /* setup */

  async init() {
    await UbiiClientService.instance.waitForConnection();

    this.clientId = UbiiClientService.instance.getClientID();

    let topicPrefix = '/' + this.clientId + '/' + this.name;
    this.components.forEach(component => {
      component.topic = component.topic.replace(PLACEHOLDER_TOPIC_PREFIX, topicPrefix);
    });

    this.componentLinearAcceleration = this.components[0];

    this.componentVibrate = new UbiiComponentVibration();
    this.components.push(this.componentVibrate.getUbiiSpecs());
    await this.componentVibrate.start();
    this.componentOrientation = new UbiiComponentOrientation(33);
    this.components.push(this.componentOrientation.getUbiiSpecs());
    await this.componentOrientation.start();
    this.componentTouch = new UbiiComponentTouchscreen(33, this.elementTouch);
    this.components.push(this.componentTouch.getUbiiSpecs());
    await this.componentTouch.start();

    await this.register();
  }

  async deinit() {
    this.running = false;
    for (let component of this.components) {
      component.stop && await component.stop();
    }
    await this.deregister();
  }

  async register() {
    await UbiiClientService.instance.waitForConnection();

    let responseDeviceRegistration = await UbiiClientService.instance.registerDevice(this);
    if (!responseDeviceRegistration || !responseDeviceRegistration.id) return;

    this.id = responseDeviceRegistration.id;
    this.hasRegisteredUbiiDevice = true;
    this.running = true;

    await this.registerEventListeners();

    this.intervalPublishContinuousData = setInterval(() => {
      this.publishContinuousDeviceData();
    }, this.publishIntervalMilliseconds);
  }

  async deregister() {
    this.intervalPublishContinuousData && clearInterval(this.intervalPublishContinuousData);

    await UbiiClientService.instance.deregisterDevice(this);
    this.hasRegisteredUbiiDevice = false;

    this.unregisterEventListeners();
  }

  registerEventListeners() {
    this.cbOnDeviceMotion = this.onDeviceMotion.bind(this);
    window.addEventListener('devicemotion', this.cbOnDeviceMotion, true);
  }

  unregisterEventListeners() {
    this.cbOnDeviceMotion && window.removeEventListener('devicemotion', this.cbOnDeviceMotion);
  }

  /* event callbacks */

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
    this.deviceData.rotationRateData = {
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

  /* ubii topic communication */

  publishContinuousDeviceData() {
    if (!this.running) {
      return;
    }

    this.publishDeviceMotion();

    // call loop
    setTimeout(this.publishContinuousDeviceData, this.publishIntervalMilliseconds);
  }

  publishDeviceMotion() {
    if (!this.deviceData.accelerationData) {
      return;
    }

    UbiiClientService.instance.publishRecord({
      topic: this.componentLinearAcceleration.topic,
      timestamp: this.deviceData.accelerationData.timestamp,
      vector3: {
        x: this.deviceData.accelerationData.acceleration.x,
        y: this.deviceData.accelerationData.acceleration.y,
        z: this.deviceData.accelerationData.acceleration.z
      }
    });
  }

  /* helpers */

  normalizeCoordinates(event, touchIndex) {
    let target = event.target;

    let touchPosition = {
      x: event.touches[touchIndex].clientX,
      y: event.touches[touchIndex].clientY
    };
    let normalizedX = (touchPosition.x - target.offsetLeft) / target.offsetWidth;
    let normalizedY = (touchPosition.y - target.offsetTop) / target.offsetHeight;

    return { x: normalizedX, y: normalizedY };
  }
}
