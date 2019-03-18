/* eslint-disable no-console */

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

    //axios.defaults.headers.post['Content-Type'] = 'application/octet-stream';
  }

  send(route, message) {
    let url = 'http://' + this.host + ':' + this.port + route;

    return new Promise((resolve, reject) => {
      /*axios({
        url: url,
        method: 'post',
        data: message,
        //config: { headers: {'Content-Type': 'application/octet-stream' }}
      })*/
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

export default RESTClient;
