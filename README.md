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
  * Event: 'client'
  * server.auth(callback)
  * server.listen(port[, host])
  * server.close([options])

* [Class: RPCClient](#class-rpcclient)
  * [new RPCClient(options)](#new-rpcclientoptions)
  * Event: 'close'
  * Event: 'closing'
  * Event: 'connecting'
  * Event: 'disconnect'
  * Event: 'message'
  * Event: 'open'
  * Event: 'ping'
  * Event: 'protocol'
  * Event: 'socketError'
  * Event: 'unexpectedMessage'
  * [client.id](#clientid)
  * [client.state](#clientstate)
  * [client.protocol](#clientprotocol)
  * [client.connect()](#clientconnect)
  * [client.close([options])](#clientcloseoptions)
  * [client.handle([method,] handler)](#handlemethod-handler)
  * [client.call(method[, params][, options])](#callmethod-params-options)
  * [client.sendRaw(message)](#clientsendrawmessage)

* [createRPCError(type[, message[, details]])](#createrpcerrortype-message-details)

### Class: RPCServer

#### new RPCServer(options)

- `options` {Object}
  - `wssOptions` {Object} - Additional [WebSocketServer options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).
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
  - `wsOptions` {Object} - Additional [WebSocket options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options).
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `Infinity`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings. Defaults to `30000`.
  - `url` {String} - The WebSocket URL to connect to.
  - `protocols` {Array<String>} - Array of subprotocols supported by this client. Defaults to `[]`.
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no limit on inbound calls. Defaults to `1`.
  - `reconnect` {Boolean} - If `true`, the client will attempt to reconnect after losing connection to the RPCServer. Only works after making one initial successful connection. Defaults to `false`.
  - `maxReconnects` {Number} - If `reconnect` is `true`, specifies the number of times to try reconnecting before failing an emitting a `close` event. Defaults to `Infinity`
  - `backoff` {Object} - If `reconnect` is `true`, specifies the options for an [ExponentialStrategy](https://github.com/MathieuTurcotte/node-backoff#class-exponentialstrategy) backoff strategy, used for reconnects.

#### client.id

* {String}

A random 36-character UUID unique to the client.

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

Returns a `Promise` which will resolve upon successfully connecting or reject if the connection fails.

#### client.sendRaw(message)

* `message` {String} - A raw message to send across the WebSocket. Not intended for general use.

#### client.close([options])
* `options` {Object}
  * `code` {Number} - The [WebSocket close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code). Defaults to `1000`.
  * `reason` {String} - The reason for closure. Defaults to `''`.
  * `awaitPending` {Boolean} - If `true`, the connection won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime.
  * `force` {Boolean} - If `true`, terminates the WebSocket connection instantly and uncleanly.

Close the underlying connection. Unless `awaitPending` is true, all in-flight outbound calls will be instantly rejected and any inbound calls in process will have their `signal` aborted. Unless `force` is true, `close()` will wait until all calls are settled before returning the final `code` and `reason` for closure.

Returns a `Promise` which resolves to an Object with properties `code` and `reason`.

In some circumstances, the final `code` and `reason` returned may be different from those which were requested. For instance, if `close()` is called twice, the first `code` provided is canonical. Also, if `close()` is called while in the CONNECTING state during the first connect, the `code` will always be `1001`, with the `reason` of `'Connection aborted'`.

#### handle([method,] handler)

* `method` {String} - The name of the method to be handled. If not provided, acts as a wildcard handler which will handle any call that doesn't have a more specific handler already registered.
* `handler` {Function} - The function to be invoked when attempting to handle a call. Can return a `Promise`.

Register a call handler. When the `handler` function is invoked, it will be passed an object with the following properties:
* `method` {String} - The name of the method being invoked (useful for wildcard handlers).
* `params` {*} - The `params` value passed to the call.
* `signal` {AbortSignal} - A signal which will abort if the underlying connection is dropped (therefore, the response will never be received by the caller). You may choose whether to ignore the signal or not, but it could save you some time if you use it to abort the call early.

If the invocation of the `handler` resolves or returns, the resolved value will be returned to the caller.
If the invocation of the `handler` rejects or throws, an error will be passed to the caller. By default, the error will be an instance of `RPCGenericError`, although additional error types are possible ([see createRPCError](#createrpcerror)).

#### call(method[, params][, options])

* `method` {String} - The name of the method to call.
* `params` {*} - Parameters to send to the call handler.
* `options` {Object}
  * `callTimeoutMs` {Number} - Milliseconds before unanswered call is rejected. Defaults to the same value as the option passed to the client/server constructor.

Calls a remote method. Returns a `Promise` which either:
* resolves to the value returned by the remote handler.
* rejects with an error.

### createRPCError(type[, message[, details]])
* `type` {String} - One of the supported error types (see below).
* `message` {String} - The error's message. Defaults to `''`.
* `details` {Object} - The details object to pass along with the error. Defaults to `{}`.

Create a special type of RPC Error which is recognised by this protocol to provide more specific error types.

Returns the corresponding `Error` object.

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