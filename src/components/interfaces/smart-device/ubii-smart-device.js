import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { proto } from '@tum-far/ubii-msg-formats';
import UbiiComponentTouchscreen from '../../../ubii/components/ubii-component-touch';
import UbiiComponentOrientation from '../../../ubii/components/ubii-component-orientation';
import UbiiComponentVibration from '../../../ubii/components/ubii-component-vibration';
import UbiiComponentAccelerometer from '../../../ubii/components/ubii-component-accelerometer';
import UbiiComponentGPS from '../../../ubii/components/ubii-component-gps';
import UbiiComponentProximity from '../../../ubii/components/ubii-component-proximity';

const UBII_SPECS_TEMPLATE = {
  name: 'web-interface-smart-device',
  tags: ['smart device', 'web interface'],
  deviceType: proto.ubii.devices.Device.DeviceType.PARTICIPANT,
  components: []
};

export default class UbiiSmartDevice {
  constructor(elementTouch, additionalDeviceProfile) {
    Object.assign(this, UBII_SPECS_TEMPLATE);
    this.tags.push(...additionalDeviceProfile.tags);

    this.publishIntervalMilliseconds = 200;
    this.elementTouch = elementTouch;
  }

  /* setup */

  async init() {
    await UbiiClientService.instance.waitForConnection();

    this.clientId = UbiiClientService.instance.getClientID();

    this._componentObjects = [];
    this.componentAccelerometer = new UbiiComponentAccelerometer();
    this.componentVibrate = new UbiiComponentVibration();
    this.componentOrientation = new UbiiComponentOrientation(33);
    this.componentTouch = new UbiiComponentTouchscreen(33, this.elementTouch);
    this.componentGPS = new UbiiComponentGPS(UBII_SPECS_TEMPLATE.name);
    this.componentProximity = new UbiiComponentProximity(UBII_SPECS_TEMPLATE.name);
    this._componentObjects.push(
      this.componentAccelerometer,
      this.componentVibrate,
      this.componentOrientation,
      this.componentTouch,
      this.componentGPS,
      this.componentProximity
    );

    let successRegister = await this.register();

    if (successRegister) {
      await this.componentAccelerometer.start();
      await this.componentVibrate.start();
      await this.componentOrientation.start();
      await this.componentTouch.start();
      await this.componentGPS.start();
    }
  }

  async deinit() {
    this.running = false;
    // Stop GPS component specifically
    if (this.componentGPS) {
      await this.componentGPS.stop();
    }
    for (let component of this.components) {
      component.stop && (await component.stop());
    }
    await this.deregister();
  }

  async register() {
    await UbiiClientService.instance.waitForConnection();
    for (const component of this._componentObjects) {
      let success = await component.register();
      if (!success) {
        console.error('failed to register component:');
        console.error(component);
        return false;
      }
    }

    this.components = this._componentObjects.map(componentObject => componentObject.getUbiiSpecs());
    let registrationSpecs = await UbiiClientService.instance.registerDevice(this);
    if (!registrationSpecs || !registrationSpecs.id) return false;

    Object.assign(this, registrationSpecs);
    console.info('registered device:');
    console.info(this);
    this.hasRegisteredUbiiDevice = true;
    this.running = true;

    return true;
  }

  async deregister() {
    this.intervalPublishContinuousData && clearInterval(this.intervalPublishContinuousData);

    await UbiiClientService.instance.deregisterDevice(this);
    this.hasRegisteredUbiiDevice = false;
  }

  toProtobuf() {}
}
