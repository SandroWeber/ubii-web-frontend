import { MSG_TYPES, proto } from '@tum-far/ubii-msg-formats';

const UBII_COMPONENT = {
    name: 'random-walker-pos',
    messageFormat: MSG_TYPES.DATASTRUCTURE_VECTOR2,
    ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
    tags: ['random-walker', 'position']
};

const UBII_DEVICE = {
    name
};

const UBII_CLIENT_PROFILE = {
    devices: [{
        name: 
    }]
};

const NOTIFY_CONDITION = {
    name: 'random-walker-max-publish-distance'
}

export default class RandomWalker {
  constructor(maxPublishDistance, maxX, maxY, moveDistance) {
    this.maxPublishDistance = maxPublishDistance;
    this.maxX = maxX;
    this.maxY = maxY;
    this.moveDistance = moveDistance;
  }

  initPosition() {
    this.position = {
      x: Math.floor(Math.random() * this.maxX),
      y: Math.floor(Math.random() * this.maxY)
    };
  }

  addPeers(listRandomWalkers) {}

  moveStep() {
    const rdnAngle = Math.random() * 2 * Math.PI;
    const moveX = Math.floor(moveDistance * Math.cos(rdnAngle));
    const moveY = Math.floor(moveDistance * Math.sin(rdnAngle));
  }
}
