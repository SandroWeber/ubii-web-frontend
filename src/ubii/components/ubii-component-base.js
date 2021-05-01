import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';

export default class UbiiComponent {
  constructor(topicSuffix) {
    this.topicSuffix = topicSuffix;
  }

  async start() {
    if (this.running) {
      return;
    }
    this.running = true;

    await UbiiClientService.waitForConnection();
    this.clientId = UbiiClientService.getClientID();
    this.topic = '/' + this.clientId + '/' + this.topicSuffix;
    
    await this.onStart();
  }

  stop() {
    this.running = false;
  }

  /**
   * UbiiClientService can be assumed to be connected.
   */
  async onStart() {
    throw new Error('base component class should not be created directly, extend instead and overwrite onStart for initialization');
  }
}
