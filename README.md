# ubii-web-frontend-vue

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


## How to create your own https certification

 install mkcert (https://github.com/FiloSottile/mkcert)

 run ```mkcert -install```

 running ```mkcert ubii.com "*.ubii.com" ubii.test localhost 127.0.0.1 ::1``` will give you 2 .pem files
 copy .pem files to /certs
 adjust vue.config.js to read .pem files

 alternatives:
 - certbot (https://certbot.eff.org/)
 - greenlock (https://www.npmjs.com/package/greenlock)
