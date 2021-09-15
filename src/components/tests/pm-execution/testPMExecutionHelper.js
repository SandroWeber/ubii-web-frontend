import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

class PMTestExecutionTriggerOnInput {
  static NAME_IN_DOUBLE = 'inDouble';
  static NAME_OUT_DOUBLE = 'outDouble';
  static NAME_IN_MUX_STRINGS = 'inMuxStrings';
  static NAME_OUT_MUX_STRING_LENGTHS = 'outMuxStringLengths';

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

  //static NAME_IN_DOUBLE = 'inDouble';
  //static NAME_OUT_DOUBLE = 'outDouble';
  //static NAME_IN_MUX_STRINGS = 'inMuxStrings';
  //static NAME_OUT_MUX_STRING_LENGTHS = 'outMuxStringLengths';
  static onProcessing(deltaTime, inputs, state) {
    let outputs = {};

    // check if changed, otherwise no output
    if (inputs.inDouble && inputs.inDouble !== state.lastInDouble) {
      state.lastInDouble = inputs.inDouble;
      outputs.outDouble = inputs.inDouble;
    }

    if (inputs.inMuxStrings && inputs.inMuxStrings.elements && inputs.inMuxStrings.elements.length > 0) {
      let muxRecords = inputs.inMuxStrings.elements;
      outputs.outMuxStringLengths = { elements: [] };
      for (let i = 0; i < muxRecords.length; i++) {
        let muxStringRecord = muxRecords[i];
        let topic = muxStringRecord.topic;
        let inputString = muxStringRecord[muxStringRecord.type];
        // detect if string length is new or has changed, if not do not produce output
        if (!state.mapStringLengths.has(topic) || state.mapStringLengths.get(topic) !== inputString.length) {
          outputs.outMuxStringLengths.elements.push({
            int32: inputString.length,
            outputTopicParams: [muxStringRecord.identity]
          });
        }
        // update map
        state.mapStringLengths.set(topic, inputString.length);
      }
    }
    
    return {outputs, state};
  }

  static getProtobuf(nameSuffix, nodeId) {
    let specs = Object.assign({}, PMTestExecutionTriggerOnInput.TEMPLATE);
    specs.name += nameSuffix;
    specs.onCreatedStringified = PMTestExecutionTriggerOnInput.onCreated.toString();
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
      success: true
    };

    this.subscriptionTokens = [];
    this.stringsForPMTriggerOnInputMux = new Map();
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
    // subscribe to test output topics
    try {
      let token = {
        topic: session.topics.pmTriggerOnInput.topicOutDouble,
        type: 'topic',
        callback: (...params) => this.onOutputDoubleFromPMTriggerOnInput(...params)
      };
      await UbiiClientService.instance.subscribeTopic(token.topic, token.callback);
      this.subscriptionTokens.push(token);

      for (let topic of session.topics.pmTriggerOnInput.demuxStringLengthTopics) {
        let token = {
          topic: topic,
          type: 'topic',
          callback: (...params) => this.onOutputStringLengthsFromPMTriggerOnInput(...params)
        };
        await UbiiClientService.instance.subscribeTopic(token.topic, token.callback);
        this.subscriptionTokens.push(token);
      }
    } catch (error) {
      console.error(error);
    }

    // set some expectations
    this.expectedDoubles = new Map();
    this.expectedStringLengths = new Map();

    this.expectedTopics = [];
    for (let session of this.settings.sessions) {
      this.expectedTopics.push(session.topics.pmTriggerOnInput.topicOutDouble);
      this.expectedTopics.push(...session.topics.pmTriggerOnInput.demuxStringLengthTopics);

      let double = Math.random();
      this.expectedDoubles.set(session.topics.pmTriggerOnInput.topicOutDouble, double);

      for (let i = 0; i < session.topics.pmTriggerOnInput.muxStringTopics.length; i++) {
        let stringTopic = session.topics.pmTriggerOnInput.muxStringTopics[i];
        let lengthTopic = session.topics.pmTriggerOnInput.demuxStringLengthTopics[i];
        // generate random string
        let stringLength = Math.floor(Math.random() * 10 + 1);
        let string = Math.random()
          .toString(16)
          .substr(2, stringLength);
        // save string and length as expected
        this.stringsForPMTriggerOnInputMux.set(stringTopic, string);
        this.expectedStringLengths.set(lengthTopic, string.length);
      }
    }

    // send sessions specs so we can run them later
    this.remainingSessionsIdsToStart = [];
    for (let session of this.settings.sessions) {
      let specSession = session.getProtobuf();
      let reply = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_ADD,
        session: specSession
      });
      if (reply.session) {
        session.updateSpec(reply.session);
        this.remainingSessionsIdsToStart.push(specSession.id);
      } else if (reply.error) {
        console.error(reply.error);
      }
    }
  }

  async startTest(nodeId) {
    if (this.statistics.status !== TestPMExecutionHelper.CONSTANTS.STATUS.READY) return;

    await this.prepareTest(nodeId);

    this.timeoutTestFailure = setTimeout(async () => {
      console.error('test timeout');
      await this.stopTest();
      this.statistics.success = false;
      this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.TIMEOUT;
    }, TestPMExecutionHelper.CONSTANTS.TIMEOUT_MS);

    let token = {
      topic: DEFAULT_TOPICS.INFO_TOPICS.RUNNING_SESSION,
      type: 'topic',
      callback: session => {
        this.remainingSessionsIdsToStart = this.remainingSessionsIdsToStart.filter(id => id !== session.id);
        if (this.remainingSessionsIdsToStart.length === 0) {
          this.runTest();
        }
      }
    };
    await UbiiClientService.instance.subscribeTopic(token.topic, token.callback);
    this.subscriptionTokens.push(token);

    for (let session of this.settings.sessions) {
      await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
        session: session.getProtobuf()
      });
    }
  }

  async runTest() {
    if (this.statistics.status === TestPMExecutionHelper.CONSTANTS.STATUS.RUNNING) return;

    this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.RUNNING;
    this.statistics.startTime = Date.now();

    for (let session of this.settings.sessions) {
      let record = {
        topic: session.topics.pmTriggerOnInput.topicInDouble,
        double: this.expectedDoubles.get(session.topics.pmTriggerOnInput.topicOutDouble),
        type: 'double'
      };
      await UbiiClientService.instance.publishRecord(record);

      for (let topic of session.topics.pmTriggerOnInput.muxStringTopics) {
        // publish random string
        await UbiiClientService.instance.publishRecord({
          topic: topic,
          string: this.stringsForPMTriggerOnInputMux.get(topic),
          type: 'string'
        });
      }
    }

    this.intervalCheckDone = setInterval(() => {
      if (this.expectedTopics.length === 0) {
        this.stopTest();
      }
    }, 100);
  }

  async stopTest() {
    if (this.statistics.status !== TestPMExecutionHelper.CONSTANTS.STATUS.RUNNING) return;

    this.timeoutTestFailure && clearTimeout(this.timeoutTestFailure);
    this.intervalCheckDone && clearInterval(this.intervalCheckDone);

    this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.SUCCESS;
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
  }

  onOutputDoubleFromPMTriggerOnInput(double, topic) {
    if (double !== this.expectedDoubles.get(topic)) {
      console.error(
        'expected double for ' +
          topic +
          ' does not match, received= ' +
          double +
          ' vs expected=' +
          this.expectedDoubles.get(topic)
      );
      this.statistics.success = false;
    }

    if (this.expectedTopics.indexOf(topic) !== -1) {
      this.expectedTopics.splice(this.expectedTopics.indexOf(topic), 1);
    }
  }

  onOutputStringLengthsFromPMTriggerOnInput(length, topic) {
    if (length !== this.expectedStringLengths.get(topic)) {
      console.error(
        'expected string length for ' +
          topic +
          ' does not match, received=' +
          length +
          ' vs expected=' +
          this.expectedStringLengths.get(topic)
      );
      this.statistics.success = false;
    }
    
    if (this.expectedTopics.indexOf(topic) !== -1) {
      this.expectedTopics.splice(this.expectedTopics.indexOf(topic), 1);
    }
  }
}

TestPMExecutionHelper.CONSTANTS = Object.freeze({
  STATUS: {
    READY: 'ready',
    RUNNING: 'running',
    SUCCESS: 'success',
    TIMEOUT: 'timeout'
  },
  TIMEOUT_MS: 3000
});

export default TestPMExecutionHelper;
