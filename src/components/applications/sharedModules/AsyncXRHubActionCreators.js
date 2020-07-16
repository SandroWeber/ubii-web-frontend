import ClientNode from '../../../services/ubiiClient/ubiiClientService';
import UbiiClientService from '../../../services/ubiiClient/ubiiClientService.js';
import * as THREE from 'three';
/* eslint-disable no-console */

export async function subscribeToRoom(roomId) {
  const topic = 'web-xr-hub/' + roomId;
  if (!UbiiClientService.isConnected) {
    return UbiiClientService.connect().then(() => {ClientNode.subscribe(topic, deserializeAndDispatchAction);}).then(response => console.log("response of sub", response));
  } else {
    return UbiiClientService.subscribe(topic, deserializeAndDispatchAction);
  }
}

function deserializeAndDispatchAction(actionString) {
  console.log("received actionString", actionString);
  const actionArray = actionString.split("/");
  if(actionArray[0] !== UbiiClientService.getClientID()){
    let error;
    switch (actionArray[1]){
      case 'RotateOnAxis':
        rotateOnAxis(actionArray[2], actionArray[3], new THREE.Vector3(actionArray[4], actionArray[5], actionArray[6]), actionArray[7], actionArray[8], false);
        break;
    }
    if(error){console.error(error);}
  }
}

export async function registerDevice(device){
  return UbiiClientService.isConnected().then(() => UbiiClientService.registerDevice(device));
}

export async function rotateOnAxis(scene, objectId, axis, angle, roomId, local) {
  if (ClientNode.connected && local) {
    const topic = 'web-xr-hub/'+ roomId;
    UbiiClientService.publishRecord(
      {
        topic,
        string: UbiiClientService.getClientID()+'/RotateOnAxis/'+scene+'/'+objectId+'/'+axis.x+'/'+axis.y+'/'+axis.z+'/'+angle
      });
  }
  const rotateOnAxisAction = {
    type: 'RotateOnAxis',
    scene, objectId, axis, angle
  };
  Dispatcher.dispatch(rotateOnAxisAction);
}

class XRHubActionDispatcher {

  callbacks = [];

  constructor() {
    if (!XRHubActionDispatcher.instance) {
      XRHubActionDispatcher.instance = this;
    }
    return XRHubActionDispatcher.instance;
  }

  subscribe(callback) {
    this.callbacks.push(callback);
  }

  dispatch(action) {
    this.callbacks.forEach(callback => {
      callback(action);
    });
  }
}

const Dispatcher = new XRHubActionDispatcher();
Object.freeze(Dispatcher);
export default Dispatcher;