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
    chargePointModel: 'OCPP 1.6 charger',
    chargePointVendor: 'ocpp-rpc co.'
});

// check that the server's registration status of the client is accepted before proceeding
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

## An RPCServer supporting multiple protocols

You can use the `RPCServer`'s `with()` method to listen for a client which matches the given protocol.

```js
import { RPCServer } from 'ocpp-rpc';

const server = new RPCServer({
    strictMode: true,
    protocols: [
        // Your preferred protocol should be at the front of the list.
        'ocpp2.1',
        'ocpp1.6',
    ]
});

server.with('ocpp2.1', async (cli) => {
    cli.handle('BootNotification', ({params}) => {
        console.log(`OCPP 2.1 client booted: ${params.chargingStation.model}`);

        return {
            currentTime: new Date().toISOString(),
            interval: 60,
            status: 'Accepted',
        };
    });
});

server.with('ocpp1.6', async (cli) => {
    cli.handle('BootNotification', ({params}) => {
        console.log(`OCPP 1.6 client booted: ${params.chargePointModel}`);

        return {
            currentTime: new Date().toISOString(),
            interval: 60,
            status: 'Accepted',
        };
    });
});

await server.listen(3000);
```

## An RPCClient supporting multiple protocols

As with the `RPCServer` example above, the `RPCClient`'s `with()` method allows you to decide how to use the client based on the agreed protocol version:

```js
import { RPCClient } from 'ocpp-rpc';

const client = new RPCClient({
    endpoint: 'ws://localhost:3000',
    identity: 'CP101',
    strictMode: true,
    protocols: [
        // The client can indicate protocol preference by placing
        // your preferred protocol at the top of the list.
        // Ultimately though, the server is responsible for
        // deciding which of these protocols to use:
        'ocpp2.1',
        'ocpp1.6',
    ]
});

client.with('ocpp1.6', async (cli) => {
    console.log('Client connected to an OCPP 1.6 server');

    const res = await cli.call('BootNotification', {
        chargePointModel: 'OCPP 1.6 charger',
        chargePointVendor: 'ocpp-rpc co.'
    });

    console.log(`Sent BootNotification. Registration ${res.status}`);
});

client.with('ocpp2.1', async (cli) => {
    console.log('Client connected to an OCPP 2.1 server');

    const res = await cli.call('BootNotification', {
        reason: 'PowerUp',
        chargingStation: {
            model: 'OCPP 2.1 charger',
            vendorName: 'ocpp-rpc co.'
        }
    });

    console.log(`Sent BootNotification. Registration ${res.status}`);
});


await client.connect();
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
    client.call('Say', {message: `Hello, ${client.identity}!`});
});

// create a simple client to connect to the server
const cli = new RPCClient({
    endpoint: 'ws://localhost:3000',
    identity: 'XYZ123'
});

cli.handle('Say', ({params}) => {
    console.log('Server said:', params.message);
});

await cli.connect();
```

See also, the guides for:

- **[Strict Validation](./strict-validation.md)** - How to ensure sent/received payloads are schema-compliant.
- **[OCPP Security](./security.md)** - How to comply with each tier of OCPP security.
