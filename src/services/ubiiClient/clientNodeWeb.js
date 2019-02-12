/* eslint-disable no-console */

import RESTClient from './restClient';
import WebsocketClient from './websocketClient';
import {ProtobufTranslator} from '@tum-far/ubii-msg-formats';


class ClientNodeWeb {
  constructor(name,
              serviceHost,
              servicePort) {
    // Properties:
    this.name = name;
    this.serviceHost = serviceHost;
    this.servicePort = servicePort;

    // Translators:
    //TODO: define message format constants in ubii-msg-formats
    this.msgTypeServiceReply = 'ubii.service.ServiceReply';
    this.msgTypeServiceRequest = 'ubii.service.ServiceRequest';
    this.msgTypeTopicData = 'ubii.topicData.TopicData';
    this.translatorServiceReply = new ProtobufTranslator(this.msgTypeServiceReply);
    this.translatorServiceRequest = new ProtobufTranslator(this.msgTypeServiceRequest);
    this.translatorTopicData = new ProtobufTranslator(this.msgTypeTopicData);

    // Cache for specifications:
    this.clientSpecification = {};
    this.deviceSpecifications = new Map();
  }

  /**
   * Initialize this client.
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.serviceClient = new RESTClient(this.serviceHost, this.servicePort);

      this.registerClient()
        .then(
          () => {
            this.initializeTopicDataClient(this.clientSpecification);
            return resolve();
          },
          (error) => {
            console.warn(error);
          })
        .catch((error) => {
          console.warn(error);
          return reject();
        });
    });
  }

  initializeTopicDataClient(clientSpecification) {
    this.topicDataClient = new WebsocketClient(
      clientSpecification.identifier,
      clientSpecification.topicDataHost,
      parseInt(clientSpecification.topicDataPortWs)
    );
    this.topicDataClient.onMessageReceived((messageBuffer) => {
      try {
        // Decode the buffer.
        let message = this.translatorTopicData.createMessageFromBuffer(messageBuffer);

        // Call callbacks.
        if (!this.processTopicData) {
          console.warn('[' + new Date() + '] ClientNodeWeb.processTopicData() has not been set!' +
            '\nMessage received:\n' + message);
        } else {
          this.processTopicData(message);
        }
      } catch (e) {
        (console.error || console.log).call(console, 'Ubii Message Translator createMessageFromBuffer failed with an error: ' + (e.stack || e));
      }
    });
  }

  /**
   * Is this client already initialized?
   */
  isInitialized() {
    // Check if both clients are initialized.
    if (this.serviceClient === undefined || this.topicDataClient === undefined) {
      return false;
    }
    return true;
  }

  /**
   * Register this client at the masterNode.
   */
  async registerClient() {
    let message = {
      clientRegistration: {
        name: this.name,
        namespace: ''
      }
    };

    return this.callService('/services', message).then(
      (reply) => {
        if (reply.clientSpecification !== undefined && reply.clientSpecification !== null) {
          this.clientSpecification = reply.clientSpecification;
        }
      }
    );
  }

  /**
   * Register the specified device at the masterNode.
   * @param {String} deviceName
   * @param {*} deviceType
   */
  async registerDevice(deviceName, deviceType) {
    return new Promise((resolve, reject) => {
      let message = {
        deviceRegistration: {
          name: deviceName,
          deviceType: deviceType,
          correspondingClientIdentifier: this.clientSpecification.identifier,
        }
      };

      this.serviceClient.send('/services', {buffer: this.translatorServiceRequest.createBufferFromPayload(message)})
        .then((reply) => {
          let message = this.translatorServiceReply.createMessageFromBuffer(reply.buffer.data);
          // The reply should be a device specification.
          if (message.deviceSpecification !== undefined && message.deviceSpecification !== null) {
            // Process the reply client specification.
            this.deviceSpecifications.set(message.deviceSpecification.name, message.deviceSpecification);
            resolve();
          } else {
            // TODO: log error
            reject();
          }
        });
    });
  }

  /**
   * Subscribe and unsubscribe to the specified topics.
   * @param {*} deviceName
   * @param {*} subscribeTopics
   * @param {*} unsubscribeTopics
   */
  async subscribe(deviceName, subscribeTopics, unsubscribeTopics) {
    return new Promise((resolve, reject) => {
      let message = {
        topic: '',
        subscription: {
          deviceIdentifier: this.deviceSpecifications.get(deviceName).identifier,
          subscribeTopics: subscribeTopics,
          unsubscribeTopics: unsubscribeTopics
        }
      };

      this.serviceClient.send('/services', {buffer: this.translatorServiceRequest.createBufferFromPayload(message)})
        .then((reply) => {
          let message = this.translatorServiceReply.createMessageFromBuffer(reply.buffer.data);
          // The reply should be a success.
          if (message.success !== undefined && message.success !== null) {
            resolve();
          } else {
            // TODO: log error
            reject();
          }
        });
    });
  }

  /**
   * Call a service specified by the topic with a message and callback.
   * @param {String} topic The topic relating to the service to be called
   * @param {Object} message An object representing the protobuf message to be sent
   * @param {Function} callback The function to be called with the reply
   */
  callService(topic, message) {
    return new Promise((resolve, reject) => {
      //TODO: just send JSON?
      // VARIANT A: PROTOBUF
      //let buffer = this.translatorServiceRequest.createBufferFromPayload(message);
      //console.info(buffer);
      //this.serviceClient.send('/services', {buffer: JSON.stringify(buffer)})
      // VARIANT B: JSON
      this.serviceClient.send(topic, {message: JSON.stringify(message)}).then(
        (reply) => {
          // VARIANT A: PROTOBUF
          //let message = this.translatorServiceReply.createMessageFromBuffer(reply.buffer.data);
          // VARIANT B: JSON
          let json = JSON.parse(reply.message);
          let message = this.translatorServiceReply.createMessageFromPayload(json);

          return resolve(message);
        },
        (error) => {
          console.error(error);
          return reject();
        });
    });
  }

  /**
   * Publish the specified value of the specified type under the specified topic to the master node.
   * @param {String} deviceName
   * @param {String} topic
   * @param {String} type
   * @param {*} value
   */
  publish(deviceName, topic, type, value) {
    let payload, buffer;

    payload = {
      deviceIdentifier: this.deviceSpecifications.get(deviceName).identifier,
      topicDataRecord: {
        topic: topic
      }
    };
    payload.topicDataRecord[type] = value;

    buffer = this.translatorTopicData.createBufferFromPayload(payload);

    this.topicDataClient.send(buffer);
  }

  onTopicDataMessageReceived(callback) {
    this.processTopicData = callback;
  }
}

export default ClientNodeWeb;