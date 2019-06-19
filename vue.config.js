const path = require('path')

module.exports = {
  chainWebpack: config => {
    const types = ['vue-modules', 'vue', 'normal-modules', 'normal']
    types.forEach(type => addStyleResource(config.module.rule('stylus').oneOf(type)))
  },
  devServer: {
    //open: process.platform === 'darwin',
    host: '127.0.0.1',
    //port: 8080, // CHANGE YOUR PORT HERE!
    https: true,
    //hotOnly: false,
  },
}

function addStyleResource (rule) {
  rule.use('style-resource')
    .loader('style-resources-loader')
    .options({
      patterns: [
        path.resolve(__dirname, './src/styles/main/main.styl'),
        path.resolve(__dirname, './src/styles/rete.styl'),
      ],
    })
}
