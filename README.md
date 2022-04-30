# OCPP-RPC

[![Coverage Status](https://coveralls.io/repos/github/mikuso/ocpp-rpc/badge.svg?branch=master)](https://coveralls.io/github/mikuso/ocpp-rpc?branch=master)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/mikuso/ocpp-rpc/Test%20Coveralls)
[![GitHub issues](https://img.shields.io/github/issues/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/issues)
[![GitHub license](https://img.shields.io/github/license/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/blob/master/LICENSE.md)
[![GitHub stars](https://img.shields.io/github/stars/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mikuso/ocpp-rpc)](https://github.com/mikuso/ocpp-rpc/network)

![OCPP-RPC](/docs/logo.png)

A client & server implementation of the WAMP-like RPC-over-websocket system defined in the [OCPP-J protcols](https://www.openchargealliance.org/protocols/) (e.g. [OCPP1.6J](https://www.openchargealliance.org/protocols/ocpp-16/) and [OCPP2.0.1J](https://www.openchargealliance.org/protocols/ocpp-201/)).

Requires Node.js >= 15.9.0 (or >= 17.2.0 for `AbortController#abort([reason])` support)

This module is built for Node.js and does not currently work in browsers.

## Who is this for?

* Anyone building an OCPP-based Charging Station or Charging Station Management System (CSMS) using Node.js.
* Anyone looking for a simple yet robust symmetrical RPC framework that runs over WebSockets.

## Features

* **Authentication** - Optional authentication step for initiating session data and filtering incoming clients.
* **Strict Validation** - Optionally enforce subprotocol schemas to prevent invalid calls & responses.
* **Automatic reconnects** - Client supports automatic exponential-backoff reconnects.
* **Automatic keep-alive** - Regularly performs pings, and drops dangling TCP connections.
* **Serve multiple subprotocols** - Simultaneously serve multiple different subprotocols from the same service endpoint.
* **Graceful shutdowns** - Supports waiting for all in-flight messages to be responded to before closing sockets.
* **Clean closing of websockets** - Supports sending & receiving WebSocket close codes & reasons.
* **Embraces abort signals** - `AbortSignal`s can be passed to most async methods.
* **Optional HTTP server** - Bring your own HTTP server if you want to, or let `RPCServer` create one for you.

## Installing

```
npm install ocpp-rpc
```

## Examples

### Barebones OCPP1.6J server

```js
const { RPCServer, createRPCError } = require('ocpp-rpc');

const server = new RPCServer({
    protocolRequired: true,
    protocols: ['ocpp1.6'],
});

server.on('client', async (client) => {
    client.handle(({method, params}) => {
        console.log(`Server got ${method} from ${client.identity}:`, params);
        throw createRPCError("NotImplemented");
    });
    client.handle('BootNotification', ({params}) => {
        console.log(`Server got BootNotification from ${client.identity}:`, params);
        return {status: "Accepted"};
    });
    client.handle('Heartbeat', ({params}) => {
        console.log(`Server got Heartbeat from ${client.identity}:`, params);
        return {currentTime: new Date().toISOString()};
    });
});

await server.listen(3000);
```

### Barebones OCPP1.6J client

```js
const { RPCClient } = require('ocpp-rpc');

const cli = new RPCClient({
    endpoint: 'ws://localhost:3000',
    identity: 'EXAMPLE',
    protocols: ['ocpp1.6'],
});

await cli.connect();

await cli.call('BootNotification', {
    "chargePointVendor": "ocpp-rpc",
    "chargePointModel": "ocpp-rpc",
});

await cli.call('Heartbeat', {});

await cli.call('StatusNotification', {
    connectorId: 0,
    errorCode: "NoError",
    status: "Available",
});
```

### Use with [Express.js](https://expressjs.com/)

```js
const {RPCServer, RPCClient} = require('ocpp-rpc');
const express = require("express");

const app = express();
const httpServer = app.listen(3000, 'localhost');

const rpcServer = new RPCServer();
httpServer.on('upgrade', rpcServer.handleUpgrade);

rpcServer.on('client', client => {
    client.call('Say', `Hello, ${client.identity}!`);
});

const cli = new RPCClient({
    endpoint: 'ws://localhost:3000',
    identity: 'XYZ123'
});

cli.handle('Say', ({params}) => {
    console.log('Server said:', params);
})

cli.connect();
```

## Strict Validation

RPC clients can operate in "strict mode", validating calls & responses according to subprotocol schemas. The goal of strict mode is to eliminate the possibility of invalid data structures being sent through RPC.

To enable strict mode, pass `strictMode: true` in the options to the [`RPCServer`](#new-rpcserveroptions) or [`RPCClient`](#new-rpcclientoptions) constructor. Alternately, you can limit strict mode to specific protocols by passing an array for `strictMode` instead. The schema ultimately used for validation is determined by whichever subprotocol is agreed between client and server.

Examples:

```js
// enable strict mode for all subprotocols
const server = new RPCServer({
    protocols: ['ocpp1.6', 'ocpp2.0.1'],
    strictMode: true,
});
```

```js
// only enable strict mode for ocpp1.6
const server = new RPCServer({
    protocols: ['ocpp1.6', 'proprietary0.1'],
    strictMode: ['ocpp1.6'],
});
```

### Effects of `strictMode`

As a caller, `strictMode` has the following effects:
* If your method or params fail validation, your call will reject immediately with a `RequestValidationError`. The call will not be sent.
* If a response to your call fails validation, the call will reject with a `ResponseValidationError`.

As a callee, `strictMode` has the following effects:
* If an inbound call's params fail validation, the call will not be passed to a handler. Instead, an error response will be automatically issued to the caller with an appropriate RPC error. A [`'messageValidationFailure'`](#event-messagevalidationfailure) event will be emitted.
* If your response to a call fails validation, the response will be discarded and an `"InternalError"` RPC error will be sent instead. A [`'messageValidationFailure'`](#event-messagevalidationfailure) event will be emitted.

### Supported validation schemas

This module natively supports the following validation schemas:

| Subprotocol |
| ----------- |
| ocpp1.6     |
| ocpp2.0.1   |

### Adding additional validation schemas

If you want to use `strictMode` with a subprotocol which is not included in the list above, you will need to add the appropriate schemas yourself. To do this, you must create a `Validator` for each subprotocol(s) and pass them to the RPC constructor using the `strictModeValidators` option.  (It is also possible to override the built-in validators this way.)

To create a Validator, you should pass the name of the subprotocol and a well-formed json schema to [`createValidator()`](#createvalidatorsubprotocol-schema). An example of a well-formed schema can be found at [`./lib/schemas/ocpp1.6json`](./lib/schemas/ocpp1.6json) or in the example below.

Example:

```js
// define a validator for subprotocol 'echo1.0'
const echoValidator = createValidator('echo1.0', [
    {
        $schema: "http://json-schema.org/draft-07/schema",
        $id: "urn:Echo.req",
        type: "object",
        properties: {
            val: {
                type: "string"
            }
        },
        additionalProperties: false,
        required: ["val"]
    },
    {
        $schema: "http://json-schema.org/draft-07/schema",
        $id: "urn:Echo.conf",
        type: "object",
        properties: {
            val: {
                type: "string"
            }
        },
        additionalProperties: false,
        required: ["val"]
    }
]);

const server = new RPCServer({
    protocols: ['echo1.0'],
    strictModeValidators: [echoValidator],
    strictMode: true,
});
```

Once created, the `Validator` is immutable and can be reused as many times as is required.

## API

* [Class: RPCServer](#class-rpcserver)
  * [new RPCServer(options)](#new-rpcserveroptions)
  * [Event: 'client'](#event-client)
  * [Event: 'error'](#event-error)
  * [Event: 'close'](#event-close)
  * [Event: 'closing'](#event-closing)
  * [server.auth(callback)](#serverauthcallback)
  * [server.handleUpgrade(request)](#serverhandleupgraderequest-socket-head)
  * [server.listen(port[, host[, options]])](#serverlistenport-host-options)
  * [server.close([options])](#servercloseoptions)

* [Class: RPCClient](#class-rpcclient)
  * [new RPCClient(options)](#new-rpcclientoptions)
  * [Event: 'badMessage'](#event-badmessage)
  * [Event: 'call'](#event-call)
  * [Event: 'close'](#event-close-1)
  * [Event: 'closing'](#event-closing-1)
  * [Event: 'connecting'](#event-connecting)
  * [Event: 'disconnect'](#event-disconnect)
  * [Event: 'open'](#event-open)
  * [Event: 'ping'](#event-ping)
  * [Event: 'protocol'](#event-protocol)
  * [Event: 'response'](#event-response)
  * [Event: 'socketError'](#event-socketerror)
  * [Event: 'unexpectedResponse'](#event-unexpectedresponse)
  * [client.identity](#clientidentity)
  * [client.state](#clientstate)
  * [client.protocol](#clientprotocol)
  * [client.connect()](#clientconnect)
  * [client.close([options])](#clientcloseoptions)
  * [client.handle([method,] handler)](#clienthandlemethod-handler)
  * [client.call(method[, params[, options]])](#clientcallmethod-params-options)
  * [client.sendRaw(message)](#clientsendrawmessage)

* [Class: RPCServerClient](#class-rpcserverclient--rpcclient)
  * [client.handshake](#clienthandshake)
  * [client.session](#clientsession)

* [createValidator(subprotocol, schema)]()
* [createRPCError(type[, message[, details]])](#createrpcerrortype-message-details)

### Class: RPCServer

#### new RPCServer(options)

- `options` {Object}
  - `protocols` {Array<String>} - Array of subprotocols supported by this server. Can be overridden in an [auth](#serverauthcallback) callback. Defaults to `[]`.
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `60000`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings to connected clients. Defaults to `30000`.
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. (There is no limit on inbound calls.) Defaults to `1`.
  - `strictMode` {Boolean} - Enable strict validation of calls & responses. Defaults to `false`. (See [Strict Validation](#strictvalidation) to understand how this works.)
  - `strictModeValidators` {Array<Validator>} - Optional additional validators to be used in conjunction with `strictMode`. (See [Strict Validation](#adding-additional-validation-schemas) to understand how this works.)
  - `maxBadMessages` {Number} - The maximum number of [non-conforming RPC messages](#event-rpcerror) which can be tolerated by the server before the client is automatically closed. Defaults to `Infinity`.
  - `wssOptions` {Object} - Additional [WebSocketServer options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).

#### Event: 'client'

* `client` {RPCServerClient}

Emitted when a client has connected and been accepted. By default, a client will be automatically accepted if it connects with a matching subprotocol offered by the server (as per the `protocols` option in the server constructor). This behaviour can be overriden by [setting an auth handler](#serverauthcallback).

#### Event: 'error'

* `error` {Error}

Emitted when the underlying WebSocketServer emits an error.

#### Event: 'close'

Emitted when the server has fully closed and all clients have been disconnected.

#### Event: 'closing'

Emitted when the server has begun closing. Beyond this point, no more clients will be accepted and the `'client'` event will no longer fire.

#### server.auth(callback)

* `callback` {Function}

Sets an authentication callback to be called before each client is accepted by the server. Setting an authentication callback is optional. By default, clients are accepted if they simply support a matching subprotocol.

The callback function is called with the following three arguments:

* `accept` {Function} - A function with the signature `accept([session[, protocol]])`. Call this function to accept the client, causing the server to emit a `'client'` event.
  * `session` {*} - Optional data to save as the client's 'session'. This data can later be retrieved from the [`session`](#clientsession) property of the client.
  * `protocol` {String} - Optionally explicitly set the subprotocol to use for this connection. If not set, the subprotocol will be decided automatically as the first mutual subprotocol (in order of the [RPCServer constructor](#new-rpcserveroptions)'s `protocols` value). If a non mutually-agreeable subprotocol value is set, the client will be rejected instead.

* `reject` {Function} - A function with the signature `reject([code[, message]])`
  * `code` {Number} - The HTTP error code to reject the upgrade. Defaults to `400`.
  * `message` {String} - An optional message to send as the response body. Defaults to `''`.

* `handshake` {Object} - A handshake object
  * `protocols` {Set} - A set of subprotocols purportedly supported by the client.
  * `identity` {String} - The identity portion of the connection URL, decoded.
  * `endpoint` {String} - The endpoint path portion of the connection URL. This is the part of the path before the identity.
  * `query` {URLSearchParams} - The query string parsed as [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).
  * `remoteAddress` {String} - The remote IP address of the socket.
  * `headers` {Object} - The HTTP headers sent in the upgrade request.
  * `request` {http.IncomingMessage} - The full HTTP request received by the underlying webserver.


Example:

```js
const rpcServer = new RPCServer();
rpcServer.auth((accept, reject, handshake) => {
    if (handshake.identity === 'TEST') {
        accept();
    } else {
        reject(401, "I don't recognise you");
    }
});
```

#### server.handleUpgrade(request, socket, head)

* `request` {http.IncomingMessage}
* `socket` {stream.Duplex} - Network socket between the server and client
* `head` {Buffer} - The first packet of the upgraded stream (may be empty)

Converts an HTTP upgrade request into a WebSocket client to be handled by this RPCServer. This method is bound to the server instance, so it is suitable to pass directly as an `http.Server`'s `'upgrade'` event handler.

This is typically only needed if you are creating your own HTTP server. HTTP servers created by [`listen()`](#serverlistenport-host-options) have their `'upgrade'` event attached to this method automatically.

Example:

```js
const rpcServer = new RPCServer();
const httpServer = http.createServer();
httpServer.on('upgrade', rpcServer.handleUpgrade);
```

#### server.listen([port[, host[, options]]])

* `port` {Number} - The port number to listen on. If not set, the operating system will assign an unused port.
* `host` {String} - The host address to bind to. If not set, connections will be accepted on all interfaces.
* `options` {Object}
  * `signal` {AbortSignal} - An `AbortSignal` used to abort the `listen()` call of the underlying `net.Server`.

Creates a simple HTTP server which only accepts websocket upgrades and returns a 404 response to any other request.

Returns a Promise which resolves to an instance of `http.Server` or rejects with an `Error` on failure.

#### server.close([options])

* `options` {Object}
  * `code` {Number} - The [WebSocket close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code) to pass to all connected clients. Defaults to `1000`.
  * `reason` {String} - The reason for closure to pass to all connected clients. Defaults to `''`.
  * `awaitPending` {Boolean} - If `true`, each connected client won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime. Defaults to `false`.
  * `force` {Boolean} - If `true`, terminates all client WebSocket connections instantly and uncleanly. Defaults to `false`.

This blocks new clients from connecting, calls [`client.close()`](#clientcloseoptions) on all connected clients, and then finally closes any listening HTTP servers which were created using [`server.listen()`](#serverlistenport-host-options).

Returns a `Promise` which resolves when the server has completed closing.

### Class: RPCClient

#### new RPCClient(options)

- `options` {Object}
  - `endpoint` {String} - The RPC server's endpoint (a websocket URL). **Required**.
  - `identity` {String} - The RPC client's identity. Will be automatically encoded. **Required**.
  - `protocols` {Array<String>} - Array of subprotocols supported by this client. Defaults to `[]`.
  - `headers` {Object} - Additional HTTP headers to send along with the websocket upgrade request. Defaults to `{}`.
  - `query` {Object|String} - An optional query string or object to append as the query string of the connection URL. Defaults to `''`.
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `60000`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings. Defaults to `30000`.
  - `strictMode` {Boolean} - Enable strict validation of calls & responses. Defaults to `false`. (See [Strict Validation](#strictvalidation) to understand how this works.)
  - `strictModeValidators` {Array<Validator>} - Optional additional validators to be used in conjunction with `strictMode`. (See [Strict Validation](#adding-additional-validation-schemas) to understand how this works.)
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no concurrency limit imposed on inbound calls. Defaults to `1`.
  - `reconnect` {Boolean} - If `true`, the client will attempt to reconnect after losing connection to the RPCServer. Only works after making one initial successful connection. Defaults to `true`.
  - `maxReconnects` {Number} - If `reconnect` is `true`, specifies the number of times to try reconnecting before failing and emitting a `close` event. Defaults to `Infinity`
  - `backoff` {Object} - If `reconnect` is `true`, specifies the options for an [ExponentialStrategy](https://github.com/MathieuTurcotte/node-backoff#class-exponentialstrategy) backoff strategy, used for reconnects.
  - `maxBadMessages` {Number} - The maximum number of [non-conforming RPC messages](#event-rpcerror) which can be tolerated by the client before the client is automatically closed. Defaults to `Infinity`.
  - `wsOptions` {Object} - Additional [WebSocket options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options).

#### Event: 'badMessage'

* `event` {Object}
  * `payload` {Buffer} - The message payload which triggered the error.
  * `error` {Error} - An error describing what went wrong.

This event is emitted when a "bad message" is received by the client. A "bad message" is simply one which does not conform to the RPC protocol. After emitting this event, the client will automatically respond with a `"RpcFrameworkError"` or similar error code (depending on the violation).

(To be clear, this event will **not** simply be emitted upon receipt of an error response or invalid call. The message itself must actually be non-conforming to the spec to be considered "bad")

If too many bad messages are received in succession, the client will be closed with a close code of `1002`. The number of bad messages tolerated before automatic closure is determined by the `maxBadMessages` option. After receiving a valid (non-bad) message, the "bad message" counter will be reset.

#### Event: 'messageValidationFailure'

* `event` {Object}
  * `messageId` {String} - The RPC message ID
  * `type` {String} - Either `call` or `response`.
  * `payload` {Array} - The full RPC message payload which triggered the error.
  * `outbound` {Boolean} - This will be `true` if the offending message originated locally.
  * `error` {Error} - An error describing what went wrong.

This event is emitted in [strict mode](#strict-validation) when an inbound or outbound call or response does not satisfy the subprotocol schema validator. See the [Effects of `strictMode`](#effects-of-strictmode) to understand what happens to the invalid message. No `'call'` or `'response'` event will be emitted.

#### Event: 'call'

* `call` {Object}
  * `messageId` {String} - The RPC message ID
  * `outbound` {Boolean} - This will be `true` if the call originated locally.
  * `payload` {Array} - The RPC call payload array.

Emitted immediately before a call request is sent, or in the case of an inbound call, immediately before the call is processed. Useful for logging or debugging.

#### Event: 'close'

* `event` {Object}
  * `code` {Number} - The close code received.
  * `reason` {String} - The reason for the connection closing.

Emitted after `client.close()` completes.

#### Event: 'closing'

Emitted when the client is closing and does not plan to reconnect.

#### Event: 'connecting'

Emitted when the client is trying to establish a new WebSocket connection. If sucessful, the this should be followed by an `'open'` event.

#### Event: 'disconnect'

* `event` {Object}
  * `code` {Number} - The close code received.
  * `reason` {String} - The reason for the connection closing.

Emitted when the underlying WebSocket has disconnected. If the client is configured to reconnect, this should be followed by a `'connecting'` event, otherwise a `'closing'` event.

#### Event: 'message'

* `event` {Object}
  * `messageId` {String|null} - The RPC message ID. If the message ID cannot be decoded, this will be null.
  * `payload` {Buffer} - The message payload buffer.
  * `outbound` {Boolean} - This will be `true` if the message originated locally.

Emitted whenever a message is sent or received over client's WebSocket. Useful for logging or debugging.

#### Event: 'open'

* `result` {Object}
  * `response` {http.ServerResponse} - The response to the client's upgrade request.

Emitted when the client is connected to the server and ready to send & receive calls.

#### Event: 'ping'

* `event` {Object}
  * `rtt` {Number} - The round trip time (in milliseconds) between when the ping was sent and the pong was received.

Emitted when the client has received a response to a ping.

#### Event: 'protocol'

* `protocol` {String} - The mutually agreed websocket subprotocol.

Emitted when the client protocol has been set. Once set, this cannot change. This event only occurs once per [`connect()`](#clientconnect).

#### Event: 'response'

* `response` {Object}
  * `outbound` {Boolean} - This will be `true` if the response originated locally.
  * `payload` {Array} - The RPC response payload array.

Emitted immediately before a response request is sent, or in the case of an inbound response, immediately before the response is processed. Useful for logging or debugging.

#### Event: 'socketError'

* `error` {Error}

Emitted when the underlying WebSocket instance fires an `'error'` event.

#### Event: 'unexpectedResponse'

* `message` {Object}
  * `type` {Number}
  * `id` {String} - The message ID unique to this session.
  * `result` {Object|null} - If the message is a result type, this contains the result.
  * `error` {Object|null} - If the message is an error type, this contains the error.
    * `code` {Number} - The error code.
    * `description` {String} - The error description.
    * `details` {Object} - The error details.

Emitted when the client receives a call result or error response for a call with message ID that it does not recognise (or has already processed).

The message `type` can be one of the following:

| Value | Message Type |
| ----- | ------------ |
| 3     | Result       |
| 4     | Error        |

#### client.identity

* {String}

The decoded client identity.

#### client.state

* {Number}

The client's state. See [state lifecycle](#rpcclient-state-lifecycle)

| Enum       | Value |
| ---------- | ----- |
| CONNECTING | 0     |
| OPEN       | 1     |
| CLOSING    | 2     |
| CLOSED     | 3     |

#### client.protocol

* {String}

The agreed subprotocol. Once connected for the first time, this subprotocol becomes fixed and will be expected upon automatic reconnects (even if the server changes the available subprotocol options).

#### client.connect()

The client will attempt to connect to the `RPCServer` specified in `options.url`.

Returns a `Promise` which will either resolve to a `result` object upon successfully connecting, or reject if the connection fails.

* `result` {Object}
  * `response` {http.ServerResponse} - The response to the client's upgrade request.

#### client.sendRaw(message)

* `message` {Array|Number|Object|String|ArrayBuffer|Buffer|DataView|TypedArray} - A raw message to send across the WebSocket.

Send arbitrary data across the websocket. Not intended for general use.

#### client.close([options])
* `options` {Object}
  * `code` {Number} - The [WebSocket close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code). Defaults to `1000`.
  * `reason` {String} - The reason for closure. Defaults to `''`.
  * `awaitPending` {Boolean} - If `true`, the connection won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime. Defaults to `false`.
  * `force` {Boolean} - If `true`, terminates the WebSocket connection instantly and uncleanly. Defaults to `false`.

Close the underlying connection. Unless `awaitPending` is true, all in-flight outbound calls will be instantly rejected and any inbound calls in process will have their `signal` aborted. Unless `force` is true, `close()` will wait until all calls are settled before returning the final `code` and `reason` for closure.

Returns a `Promise` which resolves to an Object with properties `code` and `reason`.

In some circumstances, the final `code` and `reason` returned may be different from those which were requested. For instance, if `close()` is called twice, the first `code` provided is canonical. Also, if `close()` is called while in the CONNECTING state during the first connect, the `code` will always be `1001`, with the `reason` of `'Connection aborted'`.

#### client.handle([method,] handler)

* `method` {String} - The name of the method to be handled. If not provided, acts as a wildcard handler which will handle any call that doesn't have a more specific handler already registered.
* `handler` {Function} - The function to be invoked when attempting to handle a call. Can return a `Promise`.

Register a call handler. Only one wildcard handler and one method-specific handler can be registered at a time. Attempting to register a handler with a duplicate method will override the former.

When the `handler` function is invoked, it will be passed an object with the following properties:
* `method` {String} - The name of the method being invoked (useful for wildcard handlers).
* `params` {*} - The `params` value passed to the call.
* `signal` {AbortSignal} - A signal which will abort if the underlying connection is dropped (therefore, the response will never be received by the caller). You may choose whether to ignore the signal or not, but it could save you some time if you use it to abort the call early.

If the invocation of the `handler` resolves or returns, the resolved value will be returned to the caller.
If the invocation of the `handler` rejects or throws, an error will be passed to the caller. By default, the error will be an instance of `RPCGenericError`, although additional error types are possible ([see createRPCError](#createrpcerrortype-message-details)).

#### client.call(method[, params[, options]])

* `method` {String} - The name of the method to call.
* `params` {*} - Parameters to send to the call handler.
* `options` {Object}
  * `callTimeoutMs` {Number} - Milliseconds before unanswered call is rejected. Defaults to the same value as the option passed to the client/server constructor.

Calls a remote method. Returns a `Promise` which either:
* resolves to the value returned by the remote handler.
* rejects with an error.

If the underlying connection is interrupted while waiting for a response, the `Promise` will reject with an `Error`.

It's tempting to set `callTimeoutMs` to `Infinity` but this could be a mistake; If the remote handler never returns a response, the RPC communications will be blocked as soon as `callConcurrency` is exhausted (which is `1` by default). (While this is still an unlikely outcome when using this module for both client *and* server components - interoperability with real world systems can sometimes be unpredictable.)

### Class: RPCServerClient : RPCClient

The RPCServerClient is a subclass of RPCClient. This represents an RPCClient from the server's perspective. It has all the same properties and methods as RPCClient but with a couple of additional properties...

#### client.handshake

* {Object}
  * `protocols` {Set} - A set of subprotocols purportedly supported by the client.
  * `identity` {String} - The identity portion of the connection URL, decoded.
  * `endpoint` {String} - The endpoint path portion of the connection URL. This is the part of the path before the identity.
  * `query` {URLSearchParams} - The query string parsed as [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).
  * `remoteAddress` {String} - The remote IP address of the socket.
  * `headers` {Object} - The HTTP headers sent in the upgrade request.
  * `request` {http.IncomingMessage} - The full HTTP request received by the underlying webserver.

This property holds information collected during the WebSocket connection handshake.

#### client.session

* {*}

This property can be anything. This is the value passed to `accept()` during the authentication callback.

### createValidator(subprotocol, schema)

* `subprotocol` {String} - The name of the subprotocol that this schema can validate.
* `schema` {Array} - An array of json schemas.

Returns a `Validator` object which can be used for [strict mode](#strict-validation).

### createRPCError(type[, message[, details]])
* `type` {String} - One of the supported error types (see below).
* `message` {String} - The error's message. Defaults to `''`.
* `details` {Object} - The details object to pass along with the error. Defaults to `{}`.

This is a utility function to create a special type of RPC Error to be thrown from a call handler to return a non-generic error response.

Returns an `Error` which corresponds to the specified type:

| Type                         | Description                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| GenericError                 | A generic error when no more specific error is appropriate                                                            |
| NotImplemented               | Requested method is not known                                                                                         |
| NotSupported                 | Requested method is recognised but not supported                                                                      |
| InternalError                | An internal error occurred and the receiver was not able to process the requested method successfully                 |
| ProtocolError                | Payload for method is incomplete                                                                                      |
| SecurityError                | During the processing of method a security issue occurred preventing receiver from completing the method successfully |
| FormationViolation           | Payload for the method is syntactically incorrect or not conform the PDU structure for the method                     |
| PropertyConstraintViolation  | Payload is syntactically correct but at least one field contains an invalid value                                     |
| OccurenceConstraintViolation | Payload for the method is syntactically correct but at least one of the fields violates occurence constraints         |
| TypeConstraintViolation      | Payload for the method is syntactically correct but at least one of the fields violates data type constraints         |
| MessageTypeNotSupported      | A message with a Message Type Number received is not supported by this implementation.                                |
| RpcFrameworkError            | Content of the call is not a valid RPC Request, for example: MessageId could not be read.                             |

## RPCClient state lifecycle

![RPCClient state lifecycle](./docs/statelifecycle.png)

**CLOSED**  
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.

**CONNECTING**  
* RPC calls & responses while in this state will be queued.

**OPEN**  
* Previously queued messages are sent to the server upon entering this state.
* RPC calls & responses now flow freely.

**CLOSING**  
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.

## TODO

* Add support for TLS Client certs
* Add re-configurable reconnect backoff options
* Formally support authorization headers
* Add support for signed (JWS) messages

## License

[MIT](LICENSE.md)