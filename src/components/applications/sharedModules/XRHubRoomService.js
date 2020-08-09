import ClientNode from '../../../services/ubiiClient/ubiiClientService';
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import { WEBSOCKET_TOPIC } from './XRHubConstants';
import ProtobufLibrary from '@tum-far/ubii-msg-formats/dist/js/protobuf';
/* eslint-disable no-console */

export class XRHubRoomService {

  constructor() {
    this.updateMap = new Map();
    setInterval(this.sendUpdates.bind(this), 800);
  }

  async subscribeToRoom(roomId, callback) {
    const topic = WEBSOCKET_TOPIC + roomId;
    if (!UbiiClientService.isConnected) {
      return UbiiClientService.connect().then(() => {ClientNode.subscribe(topic, callback);});
    } else {
      console.info("subscribing to topic", topic);
      return UbiiClientService.subscribe(topic, callback);
    }
  }

  async getRoomData(roomId) {
    const serviceRequest = {
      topic: "/services/xr-hub/room/get",
      topicSubscription: {roomId},
    };
    return UbiiClientService.callService(serviceRequest);
  }

  registerAndSubscribe(roomId, callback){
    this.device = {
      name: 'XR-Hub',
      deviceType: ProtobufLibrary.ubii.devices.Device.DeviceType.PARTICIPANT,
      components: [
        {
          topic: WEBSOCKET_TOPIC+ roomId,
          messageFormat: 'string',
          ioType: ProtobufLibrary.ubii.devices.Component.IOType.INPUT
        }]
    };

    return this.registerDevice(this.device).then(device => {
      this.device = device;
      return this.subscribeToRoom(roomId, callback);
    });
  }

  async registerDevice(device){
    return UbiiClientService.isConnected().then(() => UbiiClientService.registerDevice(device));
  }

  // setInterval update map objectId -> object
  updateObject3D(object3D, roomId){
    this.updateMap.set(object3D.userData.objectId, {roomId, object: object3D});
  }

  sendUpdates(){
    for(const mapEntry of this.updateMap){
      const roomId = mapEntry[1].roomId;
      const object3D = mapEntry[1].object;
      const serialized = this.serializeObject3D(object3D);
      const topic = WEBSOCKET_TOPIC + roomId;
      UbiiClientService.publishRecord(
        {
          topic,
          string: serialized
        });
      this.updateMap.delete(object3D.userData.objectId);
    }

  }

  deserializeObject3D(resp, callback){
    const message = JSON.parse(resp);
    if(message.error){
      console.error(message.error);
    } else {
      callback(message);
    }
  }

  serializeObject3D(object3D){
    return JSON.stringify(object3D.toJSON());
  }
}