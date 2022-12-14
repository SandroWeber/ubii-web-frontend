import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';
const UbiiSession = proto.ubii.sessions.Session;

const PM_INPUT_FORMAT_IMAGE = 'ubii.dataStructure.Image2D';
const PM_OUTPUT_FORMAT_OBJECTS = 'ubii.dataStructure.Object2DList';

export default class ImageProcessingSession {
  constructor(topicImageInput, topicObject2dOutput, processingModuleSpecs) {
    this.topicImageInput = topicImageInput;
    this.topicObject2dOutput = topicObject2dOutput;
    this.processingModuleSpecs = processingModuleSpecs;

    this.sessionRunning = false;
    this.initialize();
    console.info(UbiiSession);
  }

  initialize() {
    let pmInputImage = this.processingModuleSpecs.inputs.find(input => input.messageFormat === PM_INPUT_FORMAT_IMAGE);
    let pmOutputObjects = this.processingModuleSpecs.outputs.find(
      output => output.messageFormat === PM_OUTPUT_FORMAT_OBJECTS
    );
    // ubii specifications
    this.name = 'session_web-frontend-image-processing';
    this.tags = [...new Set(['image processing'].concat(this.processingModuleSpecs.tags))];
    this.processingModules = [this.processingModuleSpecs];
    this.ioMappings = [
      {
        processingModuleName: this.processingModuleSpecs.name,
        inputMappings: [{ inputName: pmInputImage.internalName, topic: this.topicImageInput }],
        outputMappings: [{ outputName: pmOutputObjects.internalName, topic: this.topicObject2dOutput }]
      }
    ];
  }

  async startSession() {
    await UbiiClientService.instance.waitForConnection();

    let response = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_START,
      session: this
    });
    if (response.error) {
      console.warn(response.error);
    } else if (response.session) {
      Object.assign(this, response.session);
      this.sessionRunning = true;
    }
  }

  async stopSession() {
    this.sessionRunning = false;

    await UbiiClientService.instance.waitForConnection();

    await UbiiClientService.instance.unsubscribe();

    let replyStopSession = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.SESSION_RUNTIME_STOP,
      session: this
    });
    if (replyStopSession.error) {
      console.warn(replyStopSession.error);
    }
  }
}
