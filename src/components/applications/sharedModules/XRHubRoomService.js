import ClientNode from '../../../services/ubiiClient/ubiiClientService';
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import { XR_HUB_ROOM_WEBSOCKET_TOPIC_PREFIX } from './XRHubConstants';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
/* eslint-disable no-console */

export class XRHubRoomService {

  constructor() {
    this.updateMap = new Map();
    setInterval(this.sendUpdates.bind(this), 800);
  }

  /**
   * Subscribes to the topic corresnponding to the given room id and attaches the given callback to the subscription
   * @param roomId {String}
   * @param callback {callback}
   * @returns {Promise<any>}
   */
  async subscribeToRoom(roomId, callback) {
    const topic = XR_HUB_ROOM_WEBSOCKET_TOPIC_PREFIX + roomId;
    if (!UbiiClientService.isConnected) {
      return UbiiClientService.connect().then(() => {ClientNode.subscribe(topic, callback);});
    } else {
      console.info("subscribing to topic", topic);
      return UbiiClientService.subscribe(topic, callback);
    }
  }

  /**
   * Requests the room data for the given room id from the server and returns it
   * @param roomId {String}
   * @returns {Promise<JSON>} the JSON string of the room
   */
  async getRoomData(roomId) {
    const serviceRequest = {
      topic: "/services/xr-hub/room/get",
      topicSubscription: {roomId},
    };
    return UbiiClientService.callService(serviceRequest);
  }

  /**
   * Registers as a device and subscribes to the topic for the romm with the given id
   * @param roomId {String}
   * @param callback {callback}
   * @returns {Promise<any>}
   */
  registerAndSubscribe(roomId, callback){
    this.device = {
      name: 'XR-Hub',
      deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
      components: [
        {
          topic: XR_HUB_ROOM_WEBSOCKET_TOPIC_PREFIX+ roomId,
          messageFormat: 'string',
          ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
        }]
    };

    return this.registerDevice(this.device).then(device => {
      this.device = device;
      return this.subscribeToRoom(roomId, callback);
    });
  }

  /**
   * Registers the given device, if a connection to the server is established
   * @param device {DeviceDefinition}
   * @returns {Promise<any>}
   */
  async registerDevice(device){
    return UbiiClientService.isConnected().then(() => UbiiClientService.registerDevice(device));
  }

  /**
   * adds the given object to the updateMap
   * using the object uuid as a key and setting a touple of room id and object as value
   * @param object3D {THREE.Object3D}
   * @param roomId {String}
   */
  updateObject3D(object3D, roomId){
    this.updateMap.set(object3D.uuid, {roomId, object: object3D});
  }

  /**
   * Sends all objects in the update map as an update for the referenced roomId in the value
   */
  sendUpdates(){
    for(const mapEntry of this.updateMap){
      const roomId = mapEntry[1].roomId;
      const object3D = mapEntry[1].object;
      const serialized = this.serializeObject3D(object3D);
      const topic = XR_HUB_ROOM_WEBSOCKET_TOPIC_PREFIX + roomId;
      UbiiClientService.publishRecord(
        {
          topic,
          string: serialized
        });
      this.updateMap.delete(object3D.uuid);
    }

  }

  /**
   * Deserializes the JSON string in the response
   * If no error is contained in the message the given callback is executed with the deserialized message
   * @param resp {Response}
   * @param callback {callback}
   */
  deserializeObject3D(resp, callback){
    const message = JSON.parse(resp);
    if(message.error){
      console.error(message.error);
    } else {
      callback(message);
    }
  }

  /**
   *
   * @param object3D {THREE.Object3D}
   * @returns {string} JSON string of the serilaized THREE.Object3D object
   */
  serializeObject3D(object3D){
    return JSON.stringify(object3D.toJSON());
  }
}