import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';

const UBII_SPECS_TEMPLATE = {
  name: 'web-interface-smart-device',
  tags: ['smart device', 'web interface'],
  deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
  components: [
    {
      topic: '<placeholder-topic-prefix>/touch_position',
      messageFormat: 'ubii.dataStructure.Vector2',
      ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER
    },
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
      topic: '<placeholder-topic-prefix>/touch_events',
      messageFormat: 'ubii.dataStructure.TouchEventList',
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
  constructor() {
    Object.assign(this, UBII_SPECS_TEMPLATE);
    this.deviceData = {};
    this.publishIntervalS = 0.02;
  }

  /* setup */

  async init() {
    await UbiiClientService.waitForConnection();

    this.clientId = UbiiClientService.getClientID();

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

    this.componentTouchPosition = this.components[0];
    this.componentOrientation = this.components[1];
    this.componentLinearAcceleration = this.components[2];
    this.componentTouchEvents = this.components[3];
    if (this.components.length === 5) {
      this.componentVibrate = this.components[4];
    }

    await this.register();
  }

  async deinit() {
    this.running = false;
    await this.deregister();
  }

  async register() {
    await UbiiClientService.waitForConnection();

    let responseDeviceRegistration = await UbiiClientService.registerDevice(this);
    if (!responseDeviceRegistration || !responseDeviceRegistration.id) return;

    this.id = responseDeviceRegistration.id;
    this.hasRegisteredUbiiDevice = true;
    this.running = true;

    await this.registerEventListeners();

    this.intervalPublishContinuousData = setInterval(() => {
      this.publishContinuousDeviceData();
    }, this.publishIntervalS * 1000);
    if (this.componentVibrate) {
      UbiiClientService.subscribeTopic(this.componentVibrate.topic, this.handleVibrationPattern);
    }
  }

  async deregister() {
    this.intervalPublishContinuousData && clearInterval(this.intervalPublishContinuousData);
    if (this.componentVibrate) {
      await UbiiClientService.unsubscribeTopic(this.componentVibrate.topic, this.handleVibrationPattern);
    }

    await UbiiClientService.deregisterDevice(this);
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
    let timestamp = UbiiClientService.generateTimestamp();
    this.deviceData.accelerationData = {
      acceleration: event.acceleration,
      timestamp: timestamp
    };
    this.deviceData.rotationRateData = {
      rotationRate: event.rotationRate,
      timestamp: timestamp
    };
  }

  onTouchStart(event) {
    this.deviceData.touches = event.touches;

    let touchList = [];
    for (let i = 0; i < event.touches.length; i++) {
      touchList.push({
        id: event.touches[i].identifier.toString(),
        type: ProtobufLibrary.ubii.dataStructure.ButtonEventType.DOWN,
        position: this.normalizeCoordinates(event, i)
      });
    }
    //console.info(touchList);
    this.publishTouchEventList(touchList);
  }

  onTouchMove(event) {
    this.deviceData.touches = event.touches;
    /*console.info('touch move');
    console.info(event.touches);*/

    this.deviceData.touchPosition = this.normalizeCoordinates(event, 0);
  }

  onTouchEnd(event) {
    this.deviceData.touches = event.touches;
    this.deviceData.touchPosition = undefined;

    let touchList = [];
    for (let i = 0; i < event.touches.length; i++) {
      touchList.push({
        id: event.touches[i].identifier.toString(),
        type: ProtobufLibrary.ubii.dataStructure.ButtonEventType.UP,
        position: this.normalizeCoordinates(event, i)
      });
    }
    //console.info(touchList);
    this.publishTouchEventList(touchList);
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

    this.deviceData.touchPosition && this.publishTouchPosition(this.deviceData.touchPosition);

    this.deviceData.currentOrientation && this.publishDeviceOrientation();

    this.publishDeviceMotion();

    // call loop
    setTimeout(this.publishContinuousDeviceData, this.publishIntervalS * 1000);
  }

  publishTouchPosition(position) {
    if (this.hasRegisteredUbiiDevice) {
      UbiiClientService.publish({
        topicDataRecord: {
          topic: this.componentTouchPosition.topic,
          vector2: position
        }
      });
    }
  }

  publishTouchEvent(type, position) {
    if (this.hasRegisteredUbiiDevice) {
      UbiiClientService.publish({
        topicDataRecord: {
          topic: this.componentTouchEvents.topic,
          touchEvent: { type: type, position: position }
        }
      });
    }
  }

  publishTouchEventList(touches) {
    if (this.hasRegisteredUbiiDevice) {
      UbiiClientService.publish({
        topicDataRecord: {
          topic: this.componentTouchEvents.topic,
          touchEventList: { elements: touches }
        }
      });
    }
  }

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

    UbiiClientService.publish({
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

    UbiiClientService.publish({
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
