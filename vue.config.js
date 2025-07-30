const path = require('path');

module.exports = {
  chainWebpack: config => {
    const types = ['vue-modules', 'vue', 'normal-modules', 'normal'];
    types.forEach(type => addStyleResource(config.module.rule('stylus').oneOf(type)));
  },
  devServer: {
    https: {
      key: './certificates/ubii.private-key.pem',
      cert: './certificates/ubii.cert.pem'
    },
    host: '192.168.0.29',
    port: 8080
  }
};

function addStyleResource(rule) {
  rule
    .use('style-resource')
    .loader('style-resources-loader')
    .options({
      patterns: [path.resolve(__dirname, './src/styles/main/main.styl')]
    });
}
