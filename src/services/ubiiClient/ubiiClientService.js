/* eslint-disable no-console */

import ClientNodeWeb from "./clientNodeWeb";
import UbiiEventBus from "./ubiiEventBus";


const uuidv4Regex = '[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}';

class UbiiClientService {
  constructor() {
    this.serverIP = window.location.hostname;
    this.serverPort = "8102";
    this.client = undefined;
    this.connected = undefined;
    this.connecting = false;

    this.onDisconnectCallbacks = [];
  }

  async connect() {
    if (this.connected || this.connecting) {
      return this.isConnected();
    }
    this.connecting = true;

    console.info('connecting to backend ' + this.serverIP + ':' + this.serverPort);

    this.client = new ClientNodeWeb('web frontend', this.serverIP, this.serverPort);
    return this.client.initialize().then(
      () => {
        if (this.client.isInitialized()) {
          console.info('UbiiClientService - client connected with ID:\n' +
            this.client.clientSpecification.id);
          this.connected = true;
          this.connecting = false;

          UbiiEventBus.$emit(UbiiEventBus.CONNECT_EVENT);
        }
      },
      (error) => {
        console.info('UbiiClientService.client.initialize() failed:\n' + error);
      });
  }

  async disconnect() {
    if (!this.connected) {
      console.warn('Client tried to disconnect without beeing connected.')
      return;
    }

    let id = this.client.clientSpecification.id;

    UbiiEventBus.$emit(UbiiEventBus.DISCONNECT_EVENT);
    this.onDisconnectCallbacks.forEach((callback) => {
      callback();
    });

    return this.client.deinitialize().then(() => {
      this.connected = false;
      this.connecting = false;
      this.client = undefined;
      console.info('client disconnected with ID: ' + id);
    });
  }

  async reconnect() {
    await this.connect();
  }

  isConnected() {
    return new Promise((resolve, reject) => {
      let maxRetries = 1000;
      let retry = 0;

      let checkConnection = () => {
        retry += 1;
        if (this.connected) {
          resolve(this.connected);
          return;
        } else {
          if (retry > maxRetries) {
            reject();
            return;
          }
          setTimeout(() => {
            checkConnection();
          }, 100);
        }
      };
      checkConnection();
    });
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
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
    device.clientId = this.client.clientSpecification.id;
    return this.client.registerDevice(device);
  }

  async registerSession(session) {
    if (this.client && this.client.isInitialized()) {
      return this.client.registerSession(session);
    }
  }

  getUUIDv4Regex() {
    return uuidv4Regex;
  }

}

export default new UbiiClientService();