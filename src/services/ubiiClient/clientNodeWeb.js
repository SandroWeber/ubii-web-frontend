/* eslint-disable no-console */

import RESTClient from "./restClient";
import WebsocketClient from "./websocketClient";
import { ProtobufTranslator, MSG_TYPES, DEFAULT_TOPICS } from "@tum-far/ubii-msg-formats";


class ClientNodeWeb {
  constructor(name,
              serverHost,
              servicePort) {
    // Properties:
    this.name = name;
    this.serverHost = serverHost;
    this.servicePort = servicePort;

    // Translators:
    this.translatorServiceReply = new ProtobufTranslator(MSG_TYPES.SERVICE_REPLY);
    //this.translatorServiceRequest = new ProtobufTranslator(MSG_TYPES.SERVICE_REQUEST);
    this.translatorTopicData = new ProtobufTranslator(MSG_TYPES.TOPIC_DATA);

    // Cache for specifications:
    this.clientSpecification = {};
    this.deviceSpecifications = new Map();

    this.topicDataCallbacks = new Map();
  }

  /**
   * Initialize this client.
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.serviceClient = new RESTClient(this.serverHost, this.servicePort);

      this.getServerConfig().then(() => {
        this.registerClient()
          .then(
            () => {
              this.initializeTopicDataClient(this.serverSpecification);
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
    });
  }

  initializeTopicDataClient(serverSpecification) {
    this.topicDataClient = new WebsocketClient(
      this.clientSpecification.id,
      this.serverHost,
      parseInt(serverSpecification.portTopicDataWs)
    );
    this.topicDataClient.onMessageReceived((messageBuffer) => {
      try {
        // Decode the buffer.
        let arrayBuffer = messageBuffer.data;
        let message = this.translatorTopicData.createMessageFromBuffer(new Uint8Array(arrayBuffer));
        this._onTopicDataMessageReceived(message);
      } catch (e) {
        (console.error || console.log).call(console, "Ubii Message Translator createMessageFromBuffer failed with an error: " + (e.stack || e));
      }
    });
  }

  /**
   * Is this client already initialized?
   */
  isInitialized() {
    return (this.serviceClient !== undefined && this.topicDataClient !== undefined);
  }

  async getServerConfig() {
    let message = {
      topic: DEFAULT_TOPICS.SERVICES.SERVER_CONFIG
    };

    return this.callService('/services', message).then(
      (reply) => {
        if (reply.server !== undefined && reply.server !== null) {
          // Process the reply client specification.
          this.serverSpecification = reply.server;
          console.info(this.serverSpecification);
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  /**
   * Register this client at the masterNode.
   */
  async registerClient() {
    let message = {
      topic: DEFAULT_TOPICS.SERVICES.CLIENT_REGISTRATION,
      client: {
        name: this.name,
        namespace: ''
      }
    };

    return this.callService('/services', message).then(
      (reply) => {
        if (reply.client !== undefined && reply.client !== null) {
          this.clientSpecification = reply.client;
          console.info(this.clientSpecification);
        }
      }
    );
  }

  /**
   * Register the specified device at the masterNode.
   * @param {object} device Object specifying device according to protobuf format ubii.devices.Device
   */
  async registerDevice(device) {
    let message = {
      topic: DEFAULT_TOPICS.SERVICES.DEVICE_REGISTRATION,
      device: device
    };

    return this.callService('/services', message).then(
      (reply) => {
        if (reply.device !== undefined && reply.device !== null) {
          // Process the reply client specification.
          this.deviceSpecifications.set(reply.device.name, reply.device);
          console.info(this.deviceSpecifications);
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  /**
   * Subscribe and unsubscribe to the specified topics.
   * @param {*} deviceName
   * @param {*} subscribeTopics
   * @param {*} unsubscribeTopics
   */
  async subscribe(topic, callback) {
    let message = {
      topic: DEFAULT_TOPICS.SERVICES.TOPIC_SUBSCRIPTION,
      topicSubscription: {
        clientId: this.clientSpecification.id,
        subscribeTopics: [topic]
      }
    };

    return this.callService('/services', message).then(
      (reply) => {
        if (reply.success !== undefined && reply.success !== null) {
          let callbacks = this.topicDataCallbacks.get(topic);
          if (callbacks && callbacks.length > 0) {
            callbacks.push(callback);
          } else {
            this.topicDataCallbacks.set(topic, [callback]);
          }
        } else {
          console.error("ClientNodeWeb - subscribe failed (" + topic + ")\n" +
            reply);
        }
      },
      (error) => {
        console.error(error);
      }
    );
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
      this.serviceClient.send(topic, { message: JSON.stringify(message) }).then(
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
      deviceId: this.deviceSpecifications.get(deviceName).id,
      topicDataRecord: {
        topic: topic
      }
    };
    payload.topicDataRecord[type] = value;

    buffer = this.translatorTopicData.createBufferFromPayload(payload);

    this.topicDataClient.send(buffer);
  }

  _onTopicDataMessageReceived(message) {
    if (message.topicDataRecord && message.topicDataRecord.topic) {
      let callbacks = this.topicDataCallbacks.get(message.topicDataRecord.topic);
      callbacks.forEach((cb) => {cb(message.topicDataRecord[message.topicDataRecord.type])})
    }
  }
}

export default ClientNodeWeb;