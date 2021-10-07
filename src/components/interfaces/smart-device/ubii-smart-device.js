import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import UbiiComponentTouchscreen from '../../../ubii/components/ubii-component-touch';

const UBII_SPECS_TEMPLATE = {
  name: 'web-interface-smart-device',
  tags: ['smart device', 'web interface'],
  deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
  components: [
    {
      topic: '<placeholder-topic-prefix>/orientation',
      messageFormat: 'ubii.dataStructure.Vector3',
      ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
    },
    {
      topic: '<placeholder-topic-prefix>/linear_acceleration',
      messageFormat: 'ubii.dataStructure.Vector3',
      ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
    },
    {
      topic: '<placeholder-topic-prefix>/vibration_pattern',
      messageFormat: 'double',
      ioType: ProtobufLibrary.ubii.devices.Component.IOType.SUBSCRIBER
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

    /*navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (!navigator.vibrate) {
      let vibrateComponentIndex = this.components.findIndex(component =>
        component.topic.includes('/vibration_pattern')
      );
      this.components.splice(vibrateComponentIndex, 1);
    } else {
      this.tNextVibrate = Date.now();
      navigator.vibrate(100);
    }*/

    let topicPrefix = '/' + this.clientId + '/' + this.name;
    this.components.forEach(component => {
      component.topic = component.topic.replace('<placeholder-topic-prefix>', topicPrefix);
    });

    this.componentOrientation = this.components[0];
    this.componentLinearAcceleration = this.components[1];
    if (this.components.length === 3) {
      this.componentVibrate = this.components[2];
    }
    this.componentTouch = new UbiiComponentTouchscreen(33, this.elementTouch);
    this.components.push(this.componentTouch);
    await this.componentTouch.start();

    await this.register();
  }

  async deinit() {
    this.running = false;
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
    if (this.componentVibrate) {
      UbiiClientService.instance.subscribeTopic(this.componentVibrate.topic, this.handleVibrationPattern);
    }
  }

  async deregister() {
    this.intervalPublishContinuousData && clearInterval(this.intervalPublishContinuousData);
    if (this.componentVibrate) {
      await UbiiClientService.instance.unsubscribeTopic(this.componentVibrate.topic, this.handleVibrationPattern);
    }

    await UbiiClientService.instance.deregisterDevice(this);
    this.hasRegisteredUbiiDevice = false;

    this.unregisterEventListeners();
  }

  registerEventListeners() {
    this.cbOnDeviceMotion = this.onDeviceMotion.bind(this);
    window.addEventListener('devicemotion', this.cbOnDeviceMotion, true);

    this.cbOnDeviceOrientation = this.onDeviceOrientation.bind(this);
    window.addEventListener('deviceorientation', this.cbOnDeviceOrientation, true);
  }

  unregisterEventListeners() {
    this.cbOnDeviceMotion && window.removeEventListener('devicemotion', this.cbOnDeviceMotion);
    this.cbOnDeviceOrientation && window.removeEventListener('deviceorientation', this.cbOnDeviceOrientation);
  }

  /* event callbacks */

  onDeviceOrientation(event) {
    // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
    this.deviceData.currentOrientation = {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    };
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
    let absVelX = Math.abs(velocityEstimate.x), absVelY = Math.abs(velocityEstimate.y), absVelZ = Math.abs(velocityEstimate.z);
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

  handleVibrationPattern(vibrationPattern) {
    if (Date.now() >= this.tNextVibrate) {
      navigator.vibrate(vibrationPattern);
      this.tNextVibrate = Date.now() + 2 * vibrationPattern;
    }
  }

  publishContinuousDeviceData() {
    if (!this.running) {
      return;
    }
    //console.info('publishContinuousDeviceData');

    this.deviceData.currentOrientation && this.publishDeviceOrientation();

    this.publishDeviceMotion();

    // call loop
    setTimeout(this.publishContinuousDeviceData, this.publishIntervalMilliseconds);
  }

  /* develop code */
  /*
  publishTouchPosition(position) {
    if (this.hasRegisteredUbiiDevice) {
      UbiiClientService.instance.publish({
        topicDataRecord: {
          topic: this.componentTouchPosition.topic,
          vector2: position
        }
      });
    }
  }

  publishTouchEvent(type, position) {
    if (this.hasRegisteredUbiiDevice) {
      UbiiClientService.instance.publish({
        topicDataRecord: {
          topic: this.componentTouchEvents.topic,
          touchEvent: { type: type, position: position }
        }
      });
    }
  }

  publishTouchEventList(touches) {
    if (this.hasRegisteredUbiiDevice) {
      UbiiClientService.instance.publish({
        topicDataRecord: {
          topic: this.componentTouchEvents.topic,
          touchEventList: { elements: touches }
        }
      });
    }
  }
  */

  publishDeviceOrientation() {
    if (!this.deviceData.currentOrientation) {
      return;
    }

    let calibrated = this.deviceData.calibratedOrientation || {
      alpha: 0,
      beta: 0,
      gamma: 0
    };

    this.deviceData.fixedCalibratedOrientation = {
      alpha: this.deviceData.currentOrientation.alpha - calibrated.alpha,
      beta: this.deviceData.currentOrientation.beta - calibrated.beta,
      gamma: this.deviceData.currentOrientation.gamma - calibrated.gamma
    };

    UbiiClientService.instance.publish({
      topicDataRecord: {
        topic: this.componentOrientation.topic,
        vector3: {
          x: this.deviceData.fixedCalibratedOrientation.alpha,
          y: this.deviceData.fixedCalibratedOrientation.beta,
          z: this.deviceData.fixedCalibratedOrientation.gamma
        }
      }
    });
  }

  publishDeviceMotion() {
    if (!this.deviceData.accelerationData) {
      return;
    }

    UbiiClientService.instance.publish({
      topicDataRecord: {
        topic: this.componentLinearAcceleration.topic,
        timestamp: this.deviceData.accelerationData.timestamp,
        vector3: {
          x: this.deviceData.accelerationData.acceleration.x,
          y: this.deviceData.accelerationData.acceleration.y,
          z: this.deviceData.accelerationData.acceleration.z
        }
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
