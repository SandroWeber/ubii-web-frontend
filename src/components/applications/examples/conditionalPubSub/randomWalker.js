import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, MSG_TYPES, proto } from '@tum-far/ubii-msg-formats';

const UBII_COMPONENT_TEMPLATE = {
    name: 'web-example_random-walker_pos',
    messageFormat: MSG_TYPES.DATASTRUCTURE_VECTOR2,
    ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
    tags: ['random-walker', 'position']
};

const UBII_DEVICE_TEMPLATE = {
    name: 'web-example_random-walker',
    components: [UBII_COMPONENT_TEMPLATE]
};

const UBII_CLIENT_PROFILE = {
    devices: []
};

const NOTIFY_CONDITION = {
    name: 'random-walker-max-publish-distance'
}

export default class RandomWalker {
  constructor(moveDistance) {
    this.moveDistance = moveDistance;

    this.position = {
      x: Math.random(),
      y: Math.random()
    };
  }

  async init() {
    await UbiiClientService.instance.waitForConnection();

    let device = Object.assign({}, UBII_DEVICE_TEMPLATE);
    device.clientId = UbiiClientService.instance.getClientID();
    let replyDeviceRegistration = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.DEVICE_REGISTRATION,
      device: device
    });
    if (replyDeviceRegistration.device) {
      this.device = replyDeviceRegistration.device;
      this.component = this.device.components[0];
      console.info('registered device:');
      console.info(this.device);
    } else {
      console.error(replyDeviceRegistration);
    }

    this.intervalMove = setInterval(() => {
      this.moveStep();
    }, 1000);
  }

  moveStep() {
    const rdnAngle = Math.random() * 2 * Math.PI;
    this.position.x += this.moveDistance * Math.cos(rdnAngle);
    this.position.y += this.moveDistance * Math.sin(rdnAngle);
    console.info('random walker position: ' + this.position.x + ',' + this.position.y);

    this.publish();
  }

  publish() {
    UbiiClientService.instance.publishRecord({
      topic: this.component.topic,
      timestamp: UbiiClientService.instance.generateTimestamp(),
      vector2: this.position
    });
  }
}

RandomWalker.CONSTANTS = Object.freeze({
  UBII_COMPONENT_TEMPLATE,
  UBII_DEVICE_TEMPLATE
});
