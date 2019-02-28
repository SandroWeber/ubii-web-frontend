/* eslint-disable no-console */

import ClientNodeWeb from './clientNodeWeb';


class UbiiClientService {
  constructor() {
    this.serverIP = window.location.hostname;
    this.serverPort = '8102';
    this.client = undefined;
    this.isConnected = false;
  }

  connect() {
    if (this.isConnected) {
      return;
    }

    console.info('connecting to backend ' + this.serverIP + ':' + this.serverPort);

    this.client = new ClientNodeWeb('web frontend', this.serverIP, this.serverPort);
    return this.client.initialize().then(
      () => {
        if (this.client.isInitialized()) {
          console.info('UbiiClientService - client connected with ID:\n' +
            this.client.clientSpecification.id);
          this.isConnected = true;
        }
      },
      (error) => {
        console.info('UbiiClientService.client.initialize() failed:\n' + error);
      });
  }

  getClientID() {
    if (this.client && this.client.isInitialized()) {
      return this.client.clientSpecification.id;
    } else {
      return undefined;
    }
  }


  /**
   * Register the specified device at the UBII server.
   * @param {object} device Object specifying device according to protobuf format ubii.devices.Device
   */
  async registerDevice(device) {
    if (this.client && this.client.isInitialized()) {
      device.clientId = this.client.clientSpecification.id;
      return this.client.registerDevice(device);
    }
  }

  async registerSession(session) {
    if (this.client && this.client.isInitialized()) {
      return this.client.registerSession(session);
    }
  }
}

export default new UbiiClientService();