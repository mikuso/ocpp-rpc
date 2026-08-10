---
title: Getting Started
group: Guides
---
# Getting Started

## Installation

```sh
npm install ocpp-rpc
```

## Barebones OCPP1.6J Server

A minimal server that accepts OCPP1.6J clients, validates their requests with strict mode, and handles some core message types:

```js
import { RPCServer, createRPCError } from 'ocpp-rpc';

const server = new RPCServer({
    protocols: ['ocpp1.6'], // server accepts ocpp1.6 subprotocol
    strictMode: true,       // enable strict validation of requests & responses
});

server.auth((accept, reject, handshake) => {
    // accept the incoming client
    accept({
        // anything passed to accept() will be attached as a 'session' property of the client.
        sessionId: 'XYZ123'
    });
});

server.on('client', async (client) => {
    console.log(`${client.session.sessionId} connected!`); // `XYZ123 connected!`

    // create a specific handler for handling BootNotification requests
    client.handle('BootNotification', ({params}) => {
        console.log(`Server got BootNotification from ${client.identity}:`, params);

        // respond to accept the client
        return {
            status: "Accepted",
            interval: 300,
            currentTime: new Date().toISOString()
        };
    });

    // create a specific handler for handling Heartbeat requests
    client.handle('Heartbeat', ({params}) => {
        console.log(`Server got Heartbeat from ${client.identity}:`, params);

        // respond with the server's current time.
        return {
            currentTime: new Date().toISOString()
        };
    });

    // create a specific handler for handling StatusNotification requests
    client.handle('StatusNotification', ({params}) => {
        console.log(`Server got StatusNotification from ${client.identity}:`, params);
        return {};
    });

    // create a wildcard handler to handle any RPC method
    client.handle(({method, params}) => {
        // This handler will be called if the incoming method cannot be handled elsewhere.
        console.log(`Server got ${method} from ${client.identity}:`, params);

        // throw an RPC error to inform the server that we don't understand the request.
        throw createRPCError("NotImplemented");
    });
});

await server.listen(3000);
```

## Barebones OCPP1.6J Client

A minimal client that connects to an OCPP server and exchanges the standard initial messages:

```js
import { RPCClient } from 'ocpp-rpc';

const cli = new RPCClient({
    endpoint: 'ws://localhost:3000', // the OCPP endpoint URL
    identity: 'EXAMPLE',             // the OCPP identity
    protocols: ['ocpp1.6'],          // client understands ocpp1.6 subprotocol
    strictMode: true,                // enable strict validation of requests & responses
});

// connect to the OCPP server
await cli.connect();

// send a BootNotification request and await the response
const bootResponse = await cli.call('BootNotification', {
    chargePointVendor: "ocpp-rpc",
    chargePointModel: "ocpp-rpc",
});

// check that the server accepted the client
if (bootResponse.status === 'Accepted') {

    // send a Heartbeat request and await the response
    const heartbeatResponse = await cli.call('Heartbeat', {});
    // read the current server time from the response
    console.log('Server time is:', heartbeatResponse.currentTime);

    // send a StatusNotification request for the controller
    await cli.call('StatusNotification', {
        connectorId: 0,
        errorCode: "NoError",
        status: "Available",
    });
}
```

## Using with Express.js

`RPCServer` can be attached to an existing HTTP server (e.g. Express) via `handleUpgrade`,
allowing RPC and HTTP routes to share the same port:

```js
import { RPCServer, RPCClient } from 'ocpp-rpc';
import express from 'express';

const app = express();
const httpServer = app.listen(3000, 'localhost');

const rpcServer = new RPCServer();
httpServer.on('upgrade', rpcServer.handleUpgrade);

rpcServer.on('client', client => {
    // RPC client connected
    client.call('Say', `Hello, ${client.identity}!`);
});

// create a simple client to connect to the server
const cli = new RPCClient({
    endpoint: 'ws://localhost:3000',
    identity: 'XYZ123'
});

cli.handle('Say', ({params}) => {
    console.log('Server said:', params);
});

await cli.connect();
```

See also, the guides for:

- **[Strict Validation](./strict-validation.md)** - How to ensure sent/received payloads are schema-compliant.
- **[OCPP Security](./security.md)** - How to comply with each tier of OCPP security.
