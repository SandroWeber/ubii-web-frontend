/* eslint-disable no-console */

// ClientNodeWeb = require('./clientNodeWeb');
import ClientNodeWeb from './clientNodeWeb';

class UbiiClientNodeService {
  constructor() {
    this.serverIP = '127.0.0.1';
    this.serverPort = '8003';
  }

  connect() {
    console.info('connecting to backend ' + this.serverIP + ':' + this.serverPort);

    this.client = new ClientNodeWeb('web frontend', this.serverIP, this.serverPort);
    this.client.initialize().then(
      () => {
        console.info(this.client.clientSpecification);
      },
      (error) => {
        console.info('UbiiClientNodeService.client.initialize() failed:\n' + error);
      });
  }

  isConnected() {
    return this.client && this.client.isInitialized();
  }
}

export default new UbiiClientNodeService();