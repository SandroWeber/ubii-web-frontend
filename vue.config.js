const path = require('path');
const fs = require('fs');

module.exports = {
  chainWebpack: config => {
    const types = ['vue-modules', 'vue', 'normal-modules', 'normal']
    types.forEach(type => addStyleResource(config.module.rule('stylus').oneOf(type)))
  },
  devServer: {
    //open: process.platform === 'darwin',
    host: 'localhost',
    //port: 8080, // CHANGE YOUR PORT HERE!
    https: {
      key: fs.readFileSync('./certs/ubii.com+6-key.pem'),
      cert: fs.readFileSync('./certs/ubii.com+6.pem')
    }
    //hotOnly: false,
  },
}

function addStyleResource(rule) {
  rule.use('style-resource')
    .loader('style-resources-loader')
    .options({
      patterns: [
        path.resolve(__dirname, './src/styles/main/main.styl'),
        path.resolve(__dirname, './src/styles/rete.styl'),
      ],
    })
}
