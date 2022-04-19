# OCPP-RPC

A client & server implementation of the WAMP-like RPC-over-websocket system defined in the [OCPP protcols](https://www.openchargealliance.org/protocols/) (e.g. [OCPP1.6-J](https://www.openchargealliance.org/protocols/ocpp-16/) and [OCPP2.0.1](https://www.openchargealliance.org/protocols/ocpp-201/)).

Requires Node.js >= 15.9.0 (or >= 17.2.0 for `AbortController#abort([reason])` support)

## Features

* **Everything is abortable** - `AbortSignal`s can be passed to most async methods.
* **Automatic reconnects** - Client supports automatic exponential-backoff reconnects.
* **Automatic keep-alive** - Regularly performs pings, and drops dangling TCP connections.
* **Graceful shutdowns** - Supports waiting for all in-flight messages to be responded to before closing sockets.
* **Clean closing of websockets** - Supports sending & receiving close codes & reasons.
* **Authentication** - Optional authentication step for filtering incoming clients.
* **Optional HTTP server** - Bring your own HTTP server if you want to, or let `RPCServer` create one for you.

## Installing

```
npm install ocpp-rpc
```

## Examples

### Creating a barebones OCPP server

```js
```

### Use with [Express.js](https://expressjs.com/)

```js
```

## API

* [Class: RPCServer](#class-rpcserver)
  * [new RPCServer(options)](#new-rpcserveroptions)
* [Class: RPCClient](#class-rpcclient)
  * [new RPCClient(options)](#new-rpcclientoptions)
  * Event: 'close'
  * Event: 'closing'
  * Event: 'socketError'
  * Event: 'ping'
  * Event: 'disconnect'
  * Event: 'connecting'
  * Event: 'open'
  * Event: 'protocol'
  * Event: 'message'
  * Event: 'unexpectedMessage'
  * Event: 'unexpectedMessage'
  * [client.id](#clientid)
  * [client.state](#clientstate)
  * [client.protocol](#clientprotocol)
  * [client.connect()](#clientconnect)
  * [client.sendRaw(message)](#clientsendrawmessage)
  * [client.close([options])](#clientcloseoptions)
  * [handle([method,] handler)](#handlemethod-handler)
  * [call(method[, params][, options])](#callmethod-params-options)

### Class: RPCServer

#### new RPCServer(options)

- `options` {Object}
  - `wssOptions` {Object} - Additional WebSocketServer options ([see docs](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback)).
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `Infinity`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings to connected clients. Defaults to `30000`.
  - `url` {String} - The WebSocket URL to connect to.
  - `protocols` {Array<String>} - Array of subprotocols supported by this client. Defaults to `[]`.
  - `protocolRequired` {Boolean} - If `protocols` is not empty, this option specifies whether a subprotocol is required. If true, connections without subprotocols are dropped during handshake. Defaults to `true`.
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no limit on inbound calls. Defaults to `1`.

### Class: RPCClient

#### new RPCClient(options)

- `options` {Object}
  - `wsOptions` {Object} - Additional WebSocket options ([see docs](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options))
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `Infinity`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings. Defaults to `30000`.
  - `url` {String} - The WebSocket URL to connect to.
  - `protocols` {Array<String>} - Array of subprotocols supported by this client. Defaults to `[]`.
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no limit on inbound calls. Defaults to `1`.
  - `reconnect` {Boolean} - If `true`, the client will attempt to reconnect after losing connection to the RPCServer. Only works after making one initial successful connection. Defaults to `false`.
  - `maxReconnects` {Number} - If `reconnect` === `true`, specifies the number of times to try reconnecting before failing an emitting a `close` event. Defaults to `Infinity`
  - `backoff` {Object} - If `reconnect` === `true`, specifies the options for the [ExponentialStrategy](https://github.com/MathieuTurcotte/node-backoff#class-exponentialstrategy) backoff strategy for reconnects.

#### client.id

* {String}

A random 36-character UUID unique to the client.

#### client.state

* {Number}

The client's state. [See state lifecycle](#rpcclient-state-lifecycle)

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

The client will attempt to connect to the `RPCServer` specified in `options.url`. Will reject if connection fails.

#### client.sendRaw(message)

* `message` {String} - A raw message to send across the WebSocket. Not intended for general use.

#### client.close([options])
* `options` {Object}
  * `code` {Number} - The [WebSocket close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code). Defaults to `1000`.
  * `reason` {String} - The reason for closure. Defaults to `''`.
  * `awaitPending` {Boolean} - If `true`, the connection won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime.
  * `force` {Boolean} - If `true`, terminates the WebSocket connection instantly and uncleanly.

Close the underlying connection. Unless `awaitPending` is true, all in-flight outbound calls will be instantly rejected and any inbound calls in process will have their `signal` aborted. Unless `force` is true, `close()` will wait until all calls are settled before returning the final `code` and `reason` for closure.

In some circumstances, the final `code` and `reason` returned may be different from those which were requested. For instance, if `close()` is called twice, the first `code` provided is canonical. Also, if `close()` is called while in the CONNECTING state during the first connect, the `code` will always be `1001`, with the `reason` of `'Connection aborted'`.

#### handle([method,] handler)

* `method` {String} - The name of the method to be handled. If not provided, acts as a wildcard handler which will handle any call that doesn't have a more specific handler already registered.
* `handler` {Function} - The function to be invoked when attempting to handle a call.

Register a call handler. When the `handler` function is invoked, it will be passed an object with the following properties:
* `method` {String} - The name of the method being invoked (useful for wildcard handlers).
* `params` {*} - The `params` value passed to the call.
* `signal` {AbortSignal} - A signal which will abort if the underlying connection is dropped (therefore, the response will never be received by the caller). You may choose whether to ignore the signal or not, but it could save you some time if you use it to abort the call early.

#### call(method[, params][, options])




## RPCClient state lifecycle

![RPCClient state lifecycle](./docs/statelifecycle.png)

**CLOSED**  
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.

**CONNECTING**  
* RPC calls & responses while in this state will be queued.

**OPEN**  
* Previously queued messages are sent to the server upon entering this state. RPC calls & responses while in this state are sent to the server after the queue is empty.

**CLOSING**  
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.

Note: Whenever the underlying websocket loses connection, any in-flight outbound RPC calls are immediately rejected, and the `AbortSignal`s passed to any in-flight inbound RPC calls are aborted.

## License

[MIT](LICENSE.md)