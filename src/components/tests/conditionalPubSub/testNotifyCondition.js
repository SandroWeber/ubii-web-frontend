import CONSTANTS from '../constants';

const NOTIFY_CONDITION_TEMPLATE = {
    name: 'frontend.test-notify-condition',
    evaluationFunctionStringified: undefined
  };
  
  const COMPONENT_TEMPLATE = {
    name: 'frontend.test-notify-condition.pub-component',
    topic: undefined,
    messageFormat: 'int32',
    ioType: proto.ubii.devices.Component.IOType.PUBLISHER,
    tags: ['test', 'NotifyCondition'],
    notifyConditionIds: []
  };
  
  const DEVICE_TEMPLATE = {
    name: 'frontend.test-notify-condition.device',
    tags: ['test', 'NotifyCondition'],
    components: []
  };

export default class TestNotifyCondition {

}