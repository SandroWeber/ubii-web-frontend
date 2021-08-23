# ubii-web-frontend

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve (no HTTPS/SSL, make sure the master node is configured not to use HTTPS either)
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

## HTTPS setup

### Build the Frontend (don't forget to re-run after making changes while developing)

Run `npm run build`

### How to create your own HTTPS certification

- Install mkcert (https://github.com/FiloSottile/mkcert)
- Run `mkcert -install`, this will create root certificate files and set everything up for you to sign your own certificates
  When later trying to connect to the frontend from remote machines, you might need to import these root certificates in the remote machine browser under authorities. Otherwise the browser might regard any socket connection over HTTPS as unsafe, even if you add an exception.
- Running `mkcert ubii.com "*.ubii.com" localhost 127.0.0.1 <host-ip-address> ::1` will give you 2 .pem files
- Copy .pem files to path-to-frontend-folder/certificates

Alternatives:

- certbot (https://certbot.eff.org/)
- greenlock (https://www.npmjs.com/package/greenlock)

### NGINX

- Install nginx (https://www.nginx.com/)
- Copy the `ubii.nginx.<os>.conf` into a folder that is used by nginx. This depends on your distribution - /etc/nginx/nginx.conf, /usr/local/nginx/conf/nginx.conf or /usr/local/etc/nginx/nginx.conf are common defaults under UNIX.
- On Windows, copy the content of config wholesale into your nginx.conf or use an include statement with the path to your ubii nginx config file
- Inside the fresh copy of `ubii.nginx.conf`, edit the paths to the certificate files and the location of root to point to the proper directory of your frontend.
