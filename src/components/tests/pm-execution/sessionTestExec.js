import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

import PMTestExecutionTriggerOnInput from './pmTestExecTriggerOnInput';

export default class SessionTestExecution {
  static TEMPLATE = {
    name: 'session-test-pm-exec',
    tags: ['test'],
    processingModules: [],
    ioMappings: []
  };
  static MUX_STRING_VARIATION_REGEX = 'mux_string_[0-9]+';

  constructor(nameSuffix) {
    this.specs = Object.assign({}, SessionTestExecution.TEMPLATE);
    this.nameSuffix = nameSuffix;
    this.specs.name += this.nameSuffix;

    this.pmCount = 0;
    this.topicPrefix = '/' + UbiiClientService.instance.getClientID() + '/' + this.specs.name;
    this.topics = {
      pmTriggerOnInput: {
        topicInDouble: this.topicPrefix + '/in_double',
        topicOutDouble: this.topicPrefix + '/out_double',
        muxStringTopics: [
          this.topicPrefix + '/mux_string_0',
          this.topicPrefix + '/mux_string_1',
          this.topicPrefix + '/mux_string_2',
          this.topicPrefix + '/mux_string_3',
          this.topicPrefix + '/mux_string_4'
        ],
        muxRegexStringTopics: this.topicPrefix + '/' + SessionTestExecution.MUX_STRING_VARIATION_REGEX,
        demuxStringLengthTopics: [
          this.topicPrefix + '/string_length/mux_string_0',
          this.topicPrefix + '/string_length/mux_string_1',
          this.topicPrefix + '/string_length/mux_string_2',
          this.topicPrefix + '/string_length/mux_string_3',
          this.topicPrefix + '/string_length/mux_string_4'
        ],
        demuxTopicPattern: this.topicPrefix + '/string_length/{{#0}}'
      }
    };
  }

  addPMTriggerOnInput(nodeId) {
    this.pmCount++;
    let pmNameSuffix = '_' + this.pmCount + '_' + this.specs.name;
    let specPM = PMTestExecutionTriggerOnInput.getProtobuf(pmNameSuffix, nodeId);

    let specIoMappings = {
      processingModuleName: specPM.name,
      inputMappings: [
        {
          inputName: PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE,
          topic: this.topics.pmTriggerOnInput.topicInDouble
        },
        {
          inputName: PMTestExecutionTriggerOnInput.NAME_IN_MUX_STRINGS,
          topicMux: {
            name: 'mux_pm-test_trigger-on-input' + pmNameSuffix,
            dataType: 'string',
            topicSelector: this.topics.pmTriggerOnInput.muxRegexStringTopics,
            identityMatchPattern: SessionTestExecution.MUX_STRING_VARIATION_REGEX
          }
        }
      ],
      outputMappings: [
        {
          outputName: PMTestExecutionTriggerOnInput.NAME_OUT_DOUBLE,
          topic: this.topics.pmTriggerOnInput.topicOutDouble
        },
        {
          outputName: PMTestExecutionTriggerOnInput.NAME_OUT_MUX_STRING_LENGTHS,
          topicDemux: {
            name: 'demux_pm-test_trigger-on-input' + pmNameSuffix,
            dataType: 'int32',
            outputTopicFormat: this.topics.pmTriggerOnInput.demuxTopicPattern
          }
        }
      ]
    };

    this.specs.processingModules.push(specPM);
    this.specs.ioMappings.push(specIoMappings);
  }

  updateSpec(sessionSpec) {
    Object.assign(this.specs, sessionSpec);
  }

  getProtobuf() {
    return this.specs;
  }
}
