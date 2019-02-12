/* eslint-disable no-console */

import ClientNodeWeb from './clientNodeWeb';


class UbiiClientService {
  constructor() {
    this.serverIP = '127.0.0.1';
    this.serverPort = '8003';
    this.client = undefined;
    this.isConnected = false;
  }

  connect() {
    console.info('connecting to backend ' + this.serverIP + ':' + this.serverPort);

    this.client = new ClientNodeWeb('web frontend', this.serverIP, this.serverPort);
    return this.client.initialize().then(
      () => {
        console.info('UbiiClientService - client connected with ID:\n' +
          this.client.clientSpecification.identifier);
        this.isConnected = true;
      },
      (error) => {
        console.info('UbiiClientService.client.initialize() failed:\n' + error);
      });
  }
}

export default new UbiiClientService();