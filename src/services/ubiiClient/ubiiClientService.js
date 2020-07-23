/* eslint-disable no-console */

import ClientNodeWeb from './clientNodeWeb';
import UbiiEventBus from './ubiiEventBus';

const uuidv4Regex =
  '[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}';

class UbiiClientService {
  constructor() {
    this.serverIP = window.location.hostname;
    this.serverPort = '8102';

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

    console.info(
      'connecting to backend ' + this.serverIP + ':' + this.serverPort
    );

    if (!this.client) {
      this.client = new ClientNodeWeb(
        'web frontend',
        this.serverIP,
        this.serverPort
      );
    }

    return this.client.initialize().then(
      () => {
        if (this.client.isInitialized()) {
          console.info(
            'UbiiClientService - client connected with ID:\n' +
              this.client.clientSpecification.id
          );
          this.connected = true;
          this.connecting = false;

          UbiiEventBus.$emit(UbiiEventBus.CONNECT_EVENT);
        }
      },
      error => {
        console.info('UbiiClientService.client.initialize() failed:\n' + error);
      }
    );
  }

  async disconnect() {
    if (!this.connected) {
      console.warn('Client tried to disconnect without beeing connected.');
      return;
    }

    let id = this.client.clientSpecification.id;

    UbiiEventBus.$emit(UbiiEventBus.DISCONNECT_EVENT);
    this.onDisconnectCallbacks.forEach(callback => {
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
    await this.client.reinitialize();
  }

  isConnected() {
    return new Promise((resolve, reject) => {
      let maxRetries = 1000;
      let retry = 0;

      let checkConnection = () => {
        retry += 1;
        if (this.client && this.client.isConnected()) {
          resolve(this.client.isConnected());
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

  async callService(serviceRequest) {
    return this.client.callService(serviceRequest);
  }

  /**
   * Register the specified device at the UBII server.
   * @param {object} device Object specifying device according to protobuf format ubii.devices.Device
   */
  async registerDevice(deviceSpecs) {
    deviceSpecs.clientId = this.client.clientSpecification.id;
    return this.client.registerDevice(deviceSpecs);
  }

  /**
   * Deregister the specified device at the UBII server.
   * @param {object} device Object specifying device according to protobuf format ubii.devices.Device
   */
  async deregisterDevice(specs) {
    return this.client.deregisterDevice(specs);
  }

  async registerSession(sessionSpecs) {
    if (this.client && this.client.isInitialized()) {
      return this.client.registerSession(sessionSpecs);
    }
  }

  publish(topicData) {
    this.client && this.client.publish(topicData);
  }

  publishRecord(topicDataRecord) {
    this.client &&
      this.client.publish({
        topicDataRecord: topicDataRecord
      });
  }

  publishRecordList(topicDataRecordList) {
    this.client &&
      this.client.publish({
        topicDataRecordList: topicDataRecordList
      });
  }

  async subscribeTopic(topic, callback) {
    return this.client && this.client.subscribeTopic(topic, callback);
  }

  async unsubscribeTopic(topic, callback) {
    return this.client && this.client.unsubscribeTopic(topic, callback);
  }

  subscribeRegex(regex, callback) {
    return this.client && this.client.subscribeRegex(regex, callback);
  }

  unsubscribeRegex(regex, callback) {
    return this.client && this.client.unsubscribeRegex(regex, callback);
  }

  getUUIDv4Regex() {
    return uuidv4Regex;
  }
}

export default new UbiiClientService();
