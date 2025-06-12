import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { proto } from '@tum-far/ubii-msg-formats';
import UbiiComponentTouchscreen from '../../../ubii/components/ubii-component-touch';
import UbiiComponentOrientation from '../../../ubii/components/ubii-component-orientation';
import UbiiComponentVibration from '../../../ubii/components/ubii-component-vibration';
import UbiiComponentAccelerometer from '../../../ubii/components/ubii-component-accelerometer';
import UbiiComponentGPS from '../../../ubii/components/ubii-component-gps';

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
    this.clientId = null;
    this.deviceId = null;
  }

  async init() {
    try {
      await UbiiClientService.instance.waitForConnection();
      this.clientId = UbiiClientService.instance.getClientID();
      
      if (!this.clientId) {
        console.error('Client not registered. Cannot initialize device.');
        return false;
      }

      this._componentObjects = [];
      this.componentAccelerometer = new UbiiComponentAccelerometer();
      this.componentVibrate = new UbiiComponentVibration();
      this.componentOrientation = new UbiiComponentOrientation(33);
      this.componentTouch = new UbiiComponentTouchscreen(33, this.elementTouch);
      this.componentGPS = new UbiiComponentGPS(UBII_SPECS_TEMPLATE.name);
      
      this._componentObjects.push(
        this.componentAccelerometer,
        this.componentVibrate,
        this.componentOrientation,
        this.componentTouch,
        this.componentGPS
      );

      // Register components first
      for (const component of this._componentObjects) {
        const success = await component.register();
        if (!success) {
          console.error('Component registration failed:', component);
          return false;
        }
      }

      // Get component specs
      this.components = this._componentObjects.map(componentObject => componentObject.getUbiiSpecs());

      // Register device
      const registrationSpecs = await UbiiClientService.instance.registerDevice({
        ...this,
        clientId: this.clientId
      });

      if (!registrationSpecs || !registrationSpecs.id) {
        console.error('Device registration failed:', registrationSpecs);
        return false;
      }

      this.deviceId = registrationSpecs.id;
      Object.assign(this, registrationSpecs);
      console.log('Device registered successfully with ID:', this.deviceId);

      // Start components
      await this.componentAccelerometer.start();
      await this.componentVibrate.start();
      await this.componentOrientation.start();
      await this.componentTouch.start();
      await this.componentGPS.start();

      return true;
    } catch (error) {
      console.error('Error during device initialization:', error);
      return false;
    }
  }

  async deinit() {
    try {
      // Stop components
      if (this.componentGPS) await this.componentGPS.stop();
      if (this.componentTouch) await this.componentTouch.stop();
      if (this.componentOrientation) await this.componentOrientation.stop();
      if (this.componentVibrate) await this.componentVibrate.stop();
      if (this.componentAccelerometer) await this.componentAccelerometer.stop();

      // Deregister device
      if (this.deviceId) {
        await UbiiClientService.instance.deregisterDevice(this);
        console.log('Device deregistered successfully');
      }

      return true;
    } catch (error) {
      console.error('Error during device deinitialization:', error);
      return false;
    }
  }

  toProtobuf() {}
}
