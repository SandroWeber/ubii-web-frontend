/* eslint-disable no-console */

import ClientNodeWeb from "./clientNodeWeb";
import UbiiEventBus from "./ubiiEventBus";


class UbiiClientService {
  constructor() {
    this.serverIP = window.location.hostname;
    this.serverPort = "8102";
    this.client = undefined;
    this.connected = false;
    this.connecting = false;
  }

  connect() {
    if (this.connected || this.connecting) {
      return this.isConnected();
    }
    this.connecting = true;

    console.info("connecting to backend " + this.serverIP + ":" + this.serverPort);

    this.client = new ClientNodeWeb("web frontend", this.serverIP, this.serverPort);
    return this.client.initialize().then(
      () => {
        if (this.client.isInitialized()) {
          console.info("UbiiClientService - client connected with ID:\n" +
            this.client.clientSpecification.id);
          this.connected = true;
          this.connecting = false;

          UbiiEventBus.$emit(UbiiEventBus.CONNECT_EVENT);
        }
      },
      (error) => {
        console.info("UbiiClientService.client.initialize() failed:\n" + error);
      });
  }

  disconnect() {
    if (!this.connected) {
      console.warn("Client tried to disconnect without beeing connected.")
      return;
    }

    let id = this.client.clientSpecification.id;

    UbiiEventBus.$emit(UbiiEventBus.DISCONNECT_EVENT);

    this.connected = false;
    this.connecting = false;
    this.client = undefined;

    console.info("client disconnected with ID: " + id);
  }

  isConnected() {
    return new Promise((resolve, reject) => {
      let maxRetries = 1000;
      let retry = 0;

      let checkConnection = () => {
        retry += 1;
        if (this.connected) {
          resolve();
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