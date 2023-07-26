import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, MSG_TYPES, proto, ProtobufTranslator } from '@tum-far/ubii-msg-formats';

const UBII_COMPONENT_POSITION_TEMPLATE = {
  name: 'web-example_random-walker_pos',
  messageFormat: MSG_TYPES.DATASTRUCTURE_VECTOR2,
  ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
  tags: ['random-walker', 'position'],
  notifyConditionIds: []
};

const UBII_COMPONENT_COLOR_TEMPLATE = {
  name: 'web-example_random-walker_color',
  messageFormat: 'string',
  ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
  tags: ['random-walker', 'color']
};

const UBII_DEVICE_TEMPLATE = {
  name: 'web-example_random-walker',
  components: [UBII_COMPONENT_POSITION_TEMPLATE, UBII_COMPONENT_COLOR_TEMPLATE]
};

const NOTIFY_CONDITION_TEMPLATE = {
  name: 'random-walker-max-publish-distance',
  evaluationFunctionStringified: undefined,
  clientProfileSub: {
    devices: [UBII_DEVICE_TEMPLATE]
  }
};

export default class BounceWalker {
  get componentPosition() {
    return this.compPos;
  }
  get componentColor() {
    return this.compColor;
  }

  constructor(moveDistance) {
    this.moveDistance = moveDistance;
    this.CONSTANTS = BounceWalker.CONSTANTS;

    this.position = {
      x: Math.random(),
      y: Math.random()
    };
  }

  async init() {
    this.colorHex = this.getRandomColorHex();
    this.direction = Math.random() * 2 * Math.PI; //Math.PI * 1.5;
    this.position = {
      x: Math.random(),
      y: Math.random()
    };

    await UbiiClientService.instance.waitForConnection();

    let replyNotifyConditionAdd = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.NOTIFY_CONDITION_ADD,
      notifyCondition: this.createNotifyCondition()
    });
    if (replyNotifyConditionAdd.notifyCondition) {
      this.notifyConditionSpecs = replyNotifyConditionAdd.notifyCondition;
      /*console.info('NotifyCondition registered:');
      console.info(this.notifyConditionSpecs);*/
    } else {
      console.error(replyNotifyConditionAdd);
      this.deinit();
      return false;
    }

    let device = Object.assign({}, UBII_DEVICE_TEMPLATE);
    device.clientId = UbiiClientService.instance.getClientID();
    device.components[0].notifyConditionIds.push(this.notifyConditionSpecs.id);
    let replyDeviceRegistration = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.DEVICE_REGISTRATION,
      device: device
    });
    if (replyDeviceRegistration.device) {
      this.device = replyDeviceRegistration.device;
      this.compPos = this.device.components.find(component => component.name === UBII_COMPONENT_POSITION_TEMPLATE.name);
      this.compColor = this.device.components.find(component => component.name === UBII_COMPONENT_COLOR_TEMPLATE.name);
      /*console.info('registered device:');
      console.info(this.device);*/
    } else {
      console.error(replyDeviceRegistration);
      return false;
    }

    UbiiClientService.instance.publishRecord({
      topic: this.compColor.topic,
      string: this.colorHex
    });

    this.intervalMove = setInterval(() => {
      this.moveStep();
    }, BounceWalker.CONSTANTS.STEP_INTERVAL_MS);

    return true;
  }

  async deinit() {
    let replyDeviceDeegistration = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.DEVICE_DEREGISTRATION,
      device: this.device
    });
  }

  moveStep() {
    this.position.x += this.moveDistance * Math.cos(this.direction);
    this.position.y += this.moveDistance * Math.sin(this.direction);
    this.position.x = Math.min(Math.max(0, this.position.x), 1);
    this.position.y = Math.min(Math.max(0, this.position.y), 1);

    // reflect at boundaries
    // this.direction: 0 = right, 0.5*Math.PI = down, Math.PI = left, 1.5*Math.PI = up
    if (this.position.x <= 0) {
      let entryAngle = Math.PI - this.direction;
      this.direction += Math.PI + 2 * entryAngle;
    }
    if (this.position.x >= 1) {
      let entryAngle = this.direction > Math.PI ? 2 * Math.PI - this.direction : 0 - this.direction;
      this.direction += Math.PI + 2 * entryAngle;
    }
    if (this.position.y <= 0) {
      let entryAngle = 1.5 * Math.PI - this.direction;
      this.direction += Math.PI + 2 * entryAngle;
    }
    if (this.position.y >= 1) {
      let entryAngle = 0.5 * Math.PI - this.direction;
      this.direction += Math.PI + 2 * entryAngle;
    }
    this.direction = this.direction % (2 * Math.PI);
    //console.info('pos: ' + this.position.x + ' ' + this.position.y + ', dir: ' + this.direction);

    this.publish();
  }

  publish() {
    UbiiClientService.instance.publishRecord({
      topic: this.compPos.topic,
      timestamp: UbiiClientService.instance.generateTimestamp(),
      vector2: this.position
    });
  }

  createNotifyCondition() {
    //let translatorCondition = new ProtobufTranslator(MSG_TYPES.NOTIFY_CONDITION);
    //console.info(placeholderComponentProfile);
    //console.info(JSON.stringify(UBII_COMPONENT_TEMPLATE));

    let condition = Object.assign({}, NOTIFY_CONDITION_TEMPLATE);
    let evaluationCallback = (publisher, subscriber, getTopicDataRecord) => {
      let recordPublisherPosition = getTopicDataRecord({ component: UBII_COMPONENT_POSITION_TEMPLATE }, publisher);
      let recordSubscriberPosition = getTopicDataRecord({ component: UBII_COMPONENT_POSITION_TEMPLATE }, subscriber);
      let posPublisher = recordPublisherPosition && recordPublisherPosition.vector2; // eslint-disable-line no-undef
      let posSubscriber = recordSubscriberPosition && recordSubscriberPosition.vector2; // eslint-disable-line no-undef

      if (typeof posPublisher === 'undefined' || typeof posSubscriber === 'undefined') return false;
      else
        return (
          Math.sqrt(Math.pow(posPublisher.x - posSubscriber.x, 2) + Math.pow(posPublisher.y - posSubscriber.y, 2)) <
          BounceWalker.CONSTANTS.MAX_SUB_DISTANCE
        );
    };
    // stringify and replace constants (undefined on master node) for evaluationCallback
    condition.evaluationFunctionStringified = evaluationCallback.toString();
    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replaceAll(
      'UBII_COMPONENT_POSITION_TEMPLATE',
      `${JSON.stringify(UBII_COMPONENT_POSITION_TEMPLATE)}`
    );
    condition.evaluationFunctionStringified = condition.evaluationFunctionStringified.replaceAll(
      'BounceWalker.CONSTANTS.MAX_SUB_DISTANCE',
      `${JSON.stringify(BounceWalker.CONSTANTS.MAX_SUB_DISTANCE)}`
    );
    /*console.info('created notifycondition:');
    console.info(condition);*/

    return condition;
  }

  getRandomColorHex() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}

BounceWalker.CONSTANTS = Object.freeze({
  UBII_COMPONENT_POSITION_TEMPLATE,
  UBII_DEVICE_TEMPLATE,
  MAX_SUB_DISTANCE: 0.25,
  STEP_INTERVAL_MS: 500
});
