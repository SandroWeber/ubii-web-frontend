/* eslint-disable no-console */

//const axios = require('axios');
import axios from 'axios';


class RESTClient {
  /**
   * Communication endpoint implementing REST pattern.
   * @param {*} host Host to connect to.
   * @param {*} port Port to connect to.
   */
  constructor(host = 'localhost',
              port = 5555) {
    this.host = host;
    this.port = port;
  }

  send(route, message) {
    let url = 'http://' + this.host + ':' + this.port + route;

    return new Promise((resolve, reject) => {
      axios.post(url, message)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          console.warn(error);
          reject(error);
        });
    });
  }
}

//module.exports = RESTClient;
export default RESTClient;
