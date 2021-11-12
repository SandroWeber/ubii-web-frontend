import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import UbiiComponent from './ubii-component-base';

const TOPIC_SUFFIX = 'orientation';

const UBII_SPECS = {
  name: 'web-component-orientation',
  messageFormat: 'ubii.dataStructure.Vector3',
  ioType: ProtobufLibrary.ubii.devices.Component.IOType.PUBLISHER,
  tags: ['imu', 'orientation'],
  description: 'web interface component - orientation'
};

export default class UbiiComponentOrientation extends UbiiComponent {
  constructor(publishFrequencyMS) {
    super(TOPIC_SUFFIX, UBII_SPECS);

    this.publishFrequencyMS = publishFrequencyMS;
  }

  onStart() {
    this.registerEventListeners();
    this.continuousPublishing();
  }

  onStop() {
    this.unregisterEventListeners();
  }

  calibrate() {
    if (this.currentOrientation) {
      this.calibratedOrientation = this.currentOrientation;
    }
  }

  /* event callbacks */

  registerEventListeners() {
    this.cbOnDeviceOrientation = this.onDeviceOrientation.bind(this);
    window.addEventListener('deviceorientation', this.cbOnDeviceOrientation, true);
  }

  unregisterEventListeners() {
    this.cbOnDeviceOrientation && window.removeEventListener('deviceorientation', this.cbOnDeviceOrientation);
  }

  onDeviceOrientation(event) {
    // https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
    this.currentOrientation = {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    };
  }

  /* topic communication */

  async continuousPublishing() {
    this.publishDeviceOrientation();

    if (this.running) {
      setTimeout(() => {
        this.continuousPublishing();
      }, this.publishFrequencyMS);
    }
  }

  publishDeviceOrientation() {
    if (!this.currentOrientation) {
      return;
    }

    let calibrated = this.calibratedOrientation || {
      alpha: 0,
      beta: 0,
      gamma: 0
    };

    this.fixedCalibratedOrientation = {
      alpha: this.currentOrientation.alpha - calibrated.alpha,
      beta: this.currentOrientation.beta - calibrated.beta,
      gamma: this.currentOrientation.gamma - calibrated.gamma
    };

    UbiiClientService.instance.publishRecord({
      topic: this.ubiiSpecs.topic,
      timestamp: UbiiClientService.instance.generateTimestamp(),
      vector3: {
        x: this.fixedCalibratedOrientation.alpha,
        y: this.fixedCalibratedOrientation.beta,
        z: this.fixedCalibratedOrientation.gamma
      }
    });
  }

  /* helper functions */
}
