class UbiiClientNodeService {
  constructor() {
    this.serverIP = '127.0.0.1';
    this.serverPort = '8080';
    this.connected = false;
  }

  connect() {
    console.info('connecting to backend ' + this.serverIP + ':' + this.serverPort);
    this.connected = true;
  }
}

export default new UbiiClientNodeService();