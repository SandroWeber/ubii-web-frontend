import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

export default class UbiiComponent {
  constructor(topicSuffix, ubiiSpecs) {
    this.topicSuffix = topicSuffix;
    this.ubiiSpecs = ubiiSpecs;
  }

  async start() {
    if (this.running) {
      return;
    }
    this.running = true;

    await UbiiClientService.instance.waitForConnection();
    this.clientId = UbiiClientService.instance.getClientID();
    this.ubiiSpecs.topic = '/' + this.clientId + '/' + this.topicSuffix;
    
    await this.onStart();
  }

  async stop() {
    this.running = false;
    await this.onStop();
  }

  async onStart() {
    throw new Error('base component class should not be created directly, extend instead and overwrite onStart for initialization');
  }

  async onStop() {
    throw new Error('base component class should not be created directly, extend instead and overwrite onStop for de-initialization');
  }
}
