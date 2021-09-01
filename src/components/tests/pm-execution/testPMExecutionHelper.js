import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

class PMTestExecutionTriggerOnInput {
  static NAME_IN_DOUBLE = 'inDouble';
  static NAME_OUT_DOUBLE = 'outDouble';

  static NAME_IN_MUX_STRINGS = 'inMuxStrings';
  static NAME_OUT_MUX_STRING_LENGTHS = 'outMuxStrings';

  static TEMPLATE = {
    name: 'pm_test-exec_trigger-on-input',
    tags: ['test', 'trigger on input'],
    processingMode: {
      triggerOnInput: {
        minDelayMs: 0,
        allInputsNeedUpdate: false
      }
    },
    inputs: [
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE,
        messageFormat: 'double'
      },
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_IN_MUX_STRINGS,
        messageFormat: 'string',
        isMuxed: true //TODO: add to msg-formats
      }
    ],
    outputs: [
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_OUT_DOUBLE,
        messageFormat: 'double'
      },
      {
        internalName: PMTestExecutionTriggerOnInput.NAME_OUT_MUX_STRING_LENGTHS,
        messageFormat: 'int32',
        isMuxed: true //TODO: add to msg-formats
      }
    ],
    onProcessingStringified: undefined,
    nodeId: undefined
  };

  static onCreated(state) {
    state.mapStringLengths = new Map();
  }

  static onProcessing(deltaTime, inputs, state) {
    let outputs = {};

    console.info(PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE + ' = ' + inputs[PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE]);

    // check if changed, otherwise no output
    if (
      inputs[PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE] &&
      inputs[PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE] !== state.lastInDouble
    ) {
      state.lastInDouble = inputs[PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE];
      outputs[PMTestExecutionTriggerOnInput.NAME_OUT_DOUBLE] = inputs[PMTestExecutionTriggerOnInput.NAME_IN_DOUBLE];
    }

    let muxStringRecords =
      inputs[PMTestExecutionTriggerOnInput.NAME_IN_MUX_STRINGS] &&
      inputs[PMTestExecutionTriggerOnInput.NAME_IN_MUX_STRINGS].elements;
    if (muxStringRecords && muxStringRecords.length > 0) {
      outputs[PMTestExecutionTriggerOnInput.NAME_OUT_MUX_STRING_LENGTHS] = {
        elements: []
      };
      for (let muxStringRecord of muxStringRecords) {
        let topic = muxStringRecord.topic;
        let string = muxStringRecord[muxStringRecord.type];
        // detect if string length is new or has changed, if not do not produce output
        if (!state.mapStringLengths.has(topic) || state.mapStringLengths.get(topic) !== string.length) {
          outputs[PMTestExecutionTriggerOnInput.NAME_OUT_MUX_STRING_LENGTHS].elements.push({
            int32: string.length,
            outputTopicParams: [muxStringRecord.identity]
          });
        }
        // update map
        state.mapStringLengths.set(muxStringRecord.topic, string.length);
      }
    }

    console.info(outputs);
    return outputs;
  }

  static getProtobuf(nameSuffix, nodeId) {
    let specs = Object.assign({}, PMTestExecutionTriggerOnInput.TEMPLATE);
    specs.name += nameSuffix;
    specs.onProcessingStringified = PMTestExecutionTriggerOnInput.onProcessing.toString();
    specs.nodeId = nodeId;

    return specs;
  }
}

class TestPMExecutionSession {
  static TEMPLATE = {
    name: 'session-test-pm-exec',
    tags: ['test'],
    processingModules: [],
    ioMappings: []
  };
  static MUX_STRING_VARIATION_REGEX = 'mux_string_[0-9]+';

  constructor(nameSuffix) {
    this.specs = Object.assign({}, TestPMExecutionSession.TEMPLATE);
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
        muxRegexStringTopics: this.topicPrefix + '/' + TestPMExecutionSession.MUX_STRING_VARIATION_REGEX,
        demuxStringLengthTopics: [
          this.topicPrefix + '/string_length/mux_string_0',
          this.topicPrefix + '/string_length/mux_string_1',
          this.topicPrefix + '/string_length/mux_string_2',
          this.topicPrefix + '/string_length/mux_string_3',
          this.topicPrefix + '/string_length/mux_string_4'
        ],
        demuxTopicPattern: this.topicPrefix + '/string_length/{{#1}}'
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
            identityMatchPattern: TestPMExecutionSession.MUX_STRING_VARIATION_REGEX
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

class TestPMExecutionHelper {
  constructor(numSessions = 1, numPMsPerSession = 1) {
    this.settings = {
      numSessions: numSessions,
      numPMsPerSession: numPMsPerSession,
      sessionCount: 0,
      sessions: []
    };

    this.statistics = {
      status: TestPMExecutionHelper.CONSTANTS.STATUS.READY,
      success: undefined
    };

    this.subscriptionTokens = [];
    this.expectedStringLengthFromPMTriggerOnInput = new Map();
  }

  addSession() {
    this.settings.sessionCount++;
    let sessionNameSufix = '_' + this.settings.sessionCount;
    let session = new TestPMExecutionSession(sessionNameSufix);
    this.settings.sessions.push(session);

    return session;
  }

  async prepareTest(nodeId) {
    let session = this.addSession();
    session.addPMTriggerOnInput(nodeId);

    //TODO: after node-webbrowser includes new topicdata implementation, switch tokens
    try {
      let token = {
        topic: session.topics.pmTriggerOnInput.topicOutDouble,
        type: 'topic',
        callback: (record) => this.onOutputDoubleFromPMTriggerOnInput(record)
      };
      await UbiiClientService.instance.subscribeTopic(token.topic, token.callback);
      this.subscriptionTokens.push(token);

      for (let topic of session.topics.pmTriggerOnInput.demuxStringLengthTopics) {
        let token = {
          topic: topic,
          type: 'topic',
          callback: (record) => this.onOutputStringLengthsFromPMTriggerOnInput(record)
        };
        await UbiiClientService.instance.subscribeTopic(token.topic, token.callback);
        this.subscriptionTokens.push(token);
      }
    } catch (error) {
      console.error(error);
    }

    this.expectedDoubles = new Map();
    this.expectedStringLenghts = new Map();
    this.expectedTopicsReceived = [];
    this.expectedTopicsReceived.push(session.topics.pmTriggerOnInput.topicOutDouble);
    this.expectedTopicsReceived.push(...session.topics.pmTriggerOnInput.demuxStringLengthTopics);
    console.info('expectedTopicsReceived:');
    console.info(this.expectedTopicsReceived);
  }

  async startTest(nodeId) {
    if (this.statistics.status !== TestPMExecutionHelper.CONSTANTS.STATUS.READY) return;

    await this.prepareTest(nodeId);

    for (let session of this.settings.sessions) {
      let specSession = session.getProtobuf();
      let reply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_ADD,
        session: specSession
      });
      if (reply.session) {
        session.updateSpec(reply.session);
        console.info(session.getProtobuf());
      } else if (reply.error) {
        console.error(reply.error);
      }
    }

    this.timeoutTestFailure = setTimeout(async () => {
      await this.stopTest();
      this.statistics.success = false;
      this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.TIMEOUT;
    }, TestPMExecutionHelper.CONSTANTS.TIMEOUT_MS);

    this.runTest();
  }

  async runTest() {
    this.statistics.startTime = Date.now();
    this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.RUNNING;

    for (let session of this.settings.sessions) {
      let double = Math.random();
      let topic = session.topics.pmTriggerOnInput.topicInDouble;
      this.expectedDoubles.set(topic, double);
      await UbiiClientService.instance.publishRecord({
        topic: topic,
        double: double
      });

      for (let topic of session.topics.pmTriggerOnInput.demuxStringLengthTopics) {
        // generate random string
        let stringLength = Math.floor(Math.random() * 10 + 1);
        let string = Math.random()
          .toString(16)
          .substr(2, stringLength);
        // save string length as expected
        this.expectedStringLengthFromPMTriggerOnInput.set(topic, string.length);
        // publish random string
        await UbiiClientService.instance.publishRecord({
          topic: topic,
          string: string
        });
      }
    }

    this.intervalCheckDone = setInterval(() => {
      if (this.expectedTopicsReceived.length === 0) {
        this.stopTest();
      }
    }, 100);
  }

  async stopTest() {
    if (this.statistics.status !== TestPMExecutionHelper.CONSTANTS.STATUS.RUNNING) return;

    this.timeoutTestFailure && clearTimeout(this.timeoutTestFailure);
    this.intervalCheckDone && clearInterval(this.intervalCheckDone);

    this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.DONE;
    this.statistics.stopTime = Date.now();

    for (let session of this.settings.sessions) {
      UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
        session: session.getProtobuf()
      });
    }

    //TODO: after node-webbrowser includes new topicdata implementation, switch tokens
    for (let token of this.subscriptionTokens) {
      if (token.type === 'topic') {
        await UbiiClientService.instance.unsubscribeTopic(token.topic, token.callback);
      }
    }

    console.info('TestPMExecution stopped:');
    console.info(this.statistics);
    console.info(this.expectedTopicsReceived);
  }

  onOutputDoubleFromPMTriggerOnInput(double, topic) {
    if (double !== this.expectedDoubles.get(topic)) {
      this.statistics.success = false;
    }

    this.expectedTopicsReceived.splice(this.expectedTopicsReceived.indexOf(topic), 1);
  }

  onOutputStringLengthsFromPMTriggerOnInput(length, topic) {
    if (length !== this.expectedStringLengthFromPMTriggerOnInput.get(topic)) {
      this.statistics.success = false;
    }
    this.expectedTopicsReceived.splice(this.expectedTopicsReceived.indexOf(topic), 1);
  }
}

TestPMExecutionHelper.CONSTANTS = Object.freeze({
  STATUS: {
    READY: 'ready',
    RUNNING: 'running',
    DONE: 'done',
    TIMEOUT: 'timeout'
  },
  TIMEOUT_MS: 3000
});

export default TestPMExecutionHelper;
