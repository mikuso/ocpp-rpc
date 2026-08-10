---
title: OCPP Security
group: Guides
---
# OCPP Security

It is possible to achieve all levels of OCPP security using this module. Keep in mind that many aspects of OCPP security (such as key management, certificate generation, etc.) are beyond the scope of this module.

## Security Profile 1 - HTTP Basic Auth

Clients provide a password via the `password` option of the `RPCClient` constructor. Servers validate it in the `auth()` callback.

```js
import { RPCClient, RPCServer } from 'ocpp-rpc';

const cli = new RPCClient({
    endpoint: 'ws://localhost',
    identity: "AzureDiamond",
    password: "hunter2",
});

const server = new RPCServer();
server.auth((accept, reject, handshake) => {
    if (handshake.identity === "AzureDiamond" && handshake.password.toString('utf8') === "hunter2") {
        accept();
    } else {
        reject(401);
    }
});

await server.listen(80);
await cli.connect();
```

> **Note on identities containing colons:** Unlike RFC7617, this library does not use a colon to
> delineate the username from the password. This allows both the identity and password to contain
> colons freely. The password is always delivered as a `Buffer`.

## Security Profile 2 - TLS

This profile requires a TLS-secured server endpoint in addition to HTTP Basic Authentication.

**Client:**

```js
import { RPCClient } from 'ocpp-rpc';

const cli = new RPCClient({
    endpoint: 'wss://localhost',
    identity: 'EXAMPLE',
    password: 'monkey1',
    wsOpts: { minVersion: 'TLSv1.2' }
});

await cli.connect();
```

**Server:**

```js
import https from 'https';
import { RPCServer } from 'ocpp-rpc';
import { readFile } from 'fs/promises';

const server = new RPCServer();

const httpsServer = https.createServer({
    cert: [
        await readFile('./server.crt', 'utf8'),    // RSA certificate
        await readFile('./ec_server.crt', 'utf8'), // ECDSA certificate
    ],
    key: [
        await readFile('./server.key', 'utf8'),    // RSA key
        await readFile('./ec_server.key', 'utf8'), // ECDSA key
    ],
    minVersion: 'TLSv1.2',
});

httpsServer.on('upgrade', server.handleUpgrade);
httpsServer.listen(443);

server.auth((accept, reject, handshake) => {
    const tlsClient = handshake.request.client;
    if (!tlsClient) return reject();
    accept();
});
```

## Security Profile 3 - Mutual TLS (mTLS)

This profile adds client-side certificates on top of Profile 2.

**Client:**

```js
import { RPCClient } from 'ocpp-rpc';
import { readFile } from 'fs/promises';

const cert = await readFile('./client.crt', 'utf8');
const key  = await readFile('./client.key', 'utf8');

const cli = new RPCClient({
    endpoint: 'wss://localhost',
    identity: 'EXAMPLE',
    wsOpts: { cert, key, minVersion: 'TLSv1.2' }
});

await cli.connect();
```

**Server:** Same as Profile 2, with `requestCert: true` added to the HTTPS options. The client
certificate is then available via `handshake.request.client.getPeerCertificate()` inside `auth()`.
