/* eslint-disable no-console */

class WebsocketClient {

  /**
   * Communication endpoint implementing websocket.
   * @param {*} identity ID string to uniquely identify this object. This id is used to route messages to this socket.
   * @param {*} host Host to connect to.
   * @param {*} port Port to connect to.
   * @param {*} onReceive Callback function accepting a message parameter that is called when a new message is received.
   * @param {*} autoconnect Should the socket connect directly after the initialization of the object?
   * If not, the start method must be called manually.
   */
  constructor(identity,
              host = 'localhost',
              port = 5555,
              autoconnect = true) {

    this.identity = identity;
    this.host = host;
    this.port = port;

    if (autoconnect) {
      this.start();
    }
  }

  /**
   * Start the websocket client.
   */
  start() {
    // init
    this.websocket = new WebSocket(`ws://${this.host}:${this.port}?clientID=${this.identity}`);
    this.websocket.binaryType = 'arraybuffer';

    // add callbacks
    this.websocket.onmessage = (message) => {
      // process pings
      /*if (payload.toString() === PING_MESSAGE) {
       this.send(PONG_MESSAGE);
       return;
       }*/
      console.info(message);

      if (!this.processMessage) {
        console.warn('[' + new Date() + '] WebsocketClient.onMessageReceived() has not been set!' +
          '\nMessage received:\n' + message);
      } else {
        this.processMessage(message);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('[' + new Date() + '] WebsocketClient ' + error.toString());
    };
  }

  onMessageReceived(callback) {
    this.processMessage = callback;
  }

  /**
   * Send a payload (string or Buffer object) to the server.
   * @param {(string|Buffer)} message
   */
  send(message) {
    // send
    this.websocket.send(message);
  }

  /**
   * Stop the dealer and close the socket.
   */
  stop() {
    this.websocket.close();
  }
}

export default WebsocketClient;