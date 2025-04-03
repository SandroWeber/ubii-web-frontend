import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

import SessionTestExecution from './sessionTestExec';

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

    this.stringsForPMTriggerOnInputMux = new Map();
    this.subTokens = [];
  }

  addSession() {
    this.settings.sessionCount++;
    let sessionNameSufix = '_' + this.settings.sessionCount;
    let session = new SessionTestExecution(sessionNameSufix);
    this.settings.sessions.push(session);

    return session;
  }

  async prepareTest(nodeId) {
    let session = this.addSession();
    session.addPMTriggerOnInput(nodeId);

    try {
      this.subTokens.push(
        await UbiiClientService.instance.subscribeTopic(session.topics.pmTriggerOnInput.topicOutDouble, (...params) =>
          this.onOutputDoubleFromPMTriggerOnInput(...params)
        )
      );

      for (let topic of session.topics.pmTriggerOnInput.demuxStringLengthTopics) {
        this.subTokens.push(
          await UbiiClientService.instance.subscribeTopic(topic, (...params) =>
            this.onOutputStringLengthsFromPMTriggerOnInput(...params)
          )
        );
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
      console.error('expected topics: ' + this.expectedTopics);
      await this.stopTest();
      this.statistics.success = false;
      this.statistics.status = TestPMExecutionHelper.CONSTANTS.STATUS.TIMEOUT;
    }, TestPMExecutionHelper.CONSTANTS.TIMEOUT_MS);

    this.subTokens.push(
      await UbiiClientService.instance.subscribeTopic(DEFAULT_TOPICS.INFO_TOPICS.RUNNING_SESSION, record => {
        this.remainingSessionsIdsToStart = this.remainingSessionsIdsToStart.filter(id => id !== record.session.id);
        if (this.remainingSessionsIdsToStart.length === 0) {
          this.runTest();
        }
      })
    );

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
    for (let token of this.subTokens) {
      await UbiiClientService.instance.unsubscribe(token);
    }
    this.subTokens = [];
  }

  onOutputDoubleFromPMTriggerOnInput(record) {
    if (record.double !== this.expectedDoubles.get(record.topic)) {
      console.error(
        'expected double for ' +
          record.topic +
          ' does not match, received= ' +
          record.double +
          ' vs expected=' +
          this.expectedDoubles.get(record.topic)
      );
      this.statistics.success = false;
    }

    if (this.expectedTopics.indexOf(record.topic) !== -1) {
      this.expectedTopics.splice(this.expectedTopics.indexOf(record.topic), 1);
    }
  }

  onOutputStringLengthsFromPMTriggerOnInput(record) {
    let length = record.int32;
    if (length !== this.expectedStringLengths.get(record.topic)) {
      console.error(
        'expected string length for ' +
          record.topic +
          ' does not match, received=' +
          length +
          ' vs expected=' +
          this.expectedStringLengths.get(record.topic)
      );
      this.statistics.success = false;
    }

    if (this.expectedTopics.indexOf(record.topic) !== -1) {
      this.expectedTopics.splice(this.expectedTopics.indexOf(record.topic), 1);
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
