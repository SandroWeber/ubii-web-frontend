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
    this.publishIntervalS = 0.02;
    this.elementTouch = elementTouch;
  }

  /* setup */

  async init() {
    await UbiiClientService.instance.waitForConnection();

    this.clientId = UbiiClientService.instance.getClientID();

    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (!navigator.vibrate) {
      let vibrateComponentIndex = this.components.findIndex(component =>
        component.topic.includes('/vibration_pattern')
      );
      this.components.splice(vibrateComponentIndex, 1);
    } else {
      this.tNextVibrate = Date.now();
      navigator.vibrate(100);
    }

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
    }, this.publishIntervalS * 1000);
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
    setTimeout(this.publishContinuousDeviceData, this.publishIntervalS * 1000);
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
