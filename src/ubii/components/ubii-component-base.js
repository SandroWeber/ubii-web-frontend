import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS } from '@tum-far/ubii-msg-formats';

/* eslint-disable: no-console */

export default class UbiiComponent {
  get id() {
    return this.ubiiSpecs.id;
  }
  get topic() {
    return this.ubiiSpecs.topic;
  }

  constructor(ubiiSpecs) {
    this.ubiiSpecs = JSON.parse(JSON.stringify(ubiiSpecs));
  }

  async start() {
    if (!this.ubiiSpecs.topic || !this.ubiiSpecs.id) {
      console.error(this.toString() + ' can not start component without topic or id, forgot to register?');
      return;
    }
    if (this.running) {
      return;
    }
    this.running = true;

    await UbiiClientService.instance.waitForConnection();
    await this.onStart();
  }

  async stop() {
    this.running = false;
    await this.onStop();
  }

  async onStart() {}

  async onStop() {}

  getUbiiSpecs() {
    return this.ubiiSpecs;
  }

  updateUbiiSpecs(specs) {
    for (const prop in specs) {
      this.ubiiSpecs[prop] = JSON.parse(JSON.stringify(specs[prop]));
    }
  }

  toString() {
    return `[UBII Component] ${this.ubiiSpecs.name} (ID ${this.ubiiSpecs.id})`;
  }

  async register() {
    await UbiiClientService.instance.waitForConnection();

    this.ubiiSpecs.clientId = UbiiClientService.instance.getClientID();
    const reply = await UbiiClientService.instance.callService({
      topic: DEFAULT_TOPICS.SERVICES.COMPONENT_REGISTRATION,
      component: this.ubiiSpecs
    });

    if (reply.error) {
      /* eslint-disable no-console */
      console.error(this.toString() + ' failed to register:');
      console.error(reply.error);
      /* eslint-enable no-console */
      return false;
    } else if (reply.component) {
      this.ubiiSpecs = reply.component;
      return true;
    }
  }
}
