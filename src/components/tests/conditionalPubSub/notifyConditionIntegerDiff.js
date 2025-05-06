import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

export default class NotifyConditionIntegerDiff {
  static UBII_TEMPLATE = {
    name: 'frontend.test-notify-condition',
    evaluationFunctionStringified: undefined
  };
  static DIFF_THRESHOLD = 5;

  get id() {
    return this.ubiiSpecs.id;
  }

  constructor(topicA, topicB) {
    this.ubiiSpecs = JSON.parse(JSON.stringify(NotifyConditionIntegerDiff.UBII_TEMPLATE));
    this.ubiiSpecs.evaluationFunctionStringified = this.evaluationCallback.toString();

    this.ubiiSpecs.evaluationFunctionStringified = this.ubiiSpecs.evaluationFunctionStringified.replace(
      'topicA',
      `'${topicA}'`
    );
    this.ubiiSpecs.evaluationFunctionStringified = this.ubiiSpecs.evaluationFunctionStringified.replace(
      'topicB',
      `'${topicB}'`
    );
    this.ubiiSpecs.evaluationFunctionStringified = this.ubiiSpecs.evaluationFunctionStringified.replace(
      'NotifyConditionIntegerDiff.DIFF_THRESHOLD',
      `${NotifyConditionIntegerDiff.DIFF_THRESHOLD}`
    );
  }

  evaluationCallback(publisher, subscriber, getTopicDataRecord) {
    let recordA = getTopicDataRecord({ topic: topicA });
    let recordB = getTopicDataRecord({ topic: topicB });
    let intA = recordA && recordA.int32; // eslint-disable-line no-undef
    let intB = recordB && recordB.int32; // eslint-disable-line no-undef

    if (typeof intA === 'undefined' || typeof intB === 'undefined') return false;
    else return Math.abs(intA - intB) < NotifyConditionIntegerDiff.DIFF_THRESHOLD;
  }

  async register() {
    let reply = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.NOTIFY_CONDITION_ADD,
      notifyCondition: this.ubiiSpecs
    });
    if (reply.notifyCondition) {
      this.ubiiSpecs = reply.notifyCondition;
      return true;
    } else {
      console.error(reply);
      return false;
    }
  }
}
