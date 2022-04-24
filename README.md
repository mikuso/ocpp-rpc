# OCPP-RPC

A client & server implementation of the WAMP-like RPC-over-websocket system defined in the [OCPP-J protcols](https://www.openchargealliance.org/protocols/) (e.g. [OCPP1.6J](https://www.openchargealliance.org/protocols/ocpp-16/) and [OCPP2.0.1J](https://www.openchargealliance.org/protocols/ocpp-201/)).

Requires Node.js >= 15.9.0 (or >= 17.2.0 for `AbortController#abort([reason])` support)

This module does not currently work in browsers.

## Features

* **Automatic reconnects** - Client supports automatic exponential-backoff reconnects.
* **Automatic keep-alive** - Regularly performs pings, and drops dangling TCP connections.
* **Graceful shutdowns** - Supports waiting for all in-flight messages to be responded to before closing sockets.
* **Clean closing of websockets** - Supports sending & receiving close codes & reasons.
* **Embraces abort signals** - `AbortSignal`s can be passed to most async methods.
* **Authentication** - Optional authentication step for initiating session data and filtering incoming clients.
* **Optional HTTP server** - Bring your own HTTP server if you want to, or let `RPCServer` create one for you.

## Installing

```
npm install ocpp-rpc
```

## Examples

### Creating a barebones OCPP client & server

```js
```

### Use with [Express.js](https://expressjs.com/)

```js
```

## API

* [Class: RPCServer](#class-rpcserver)
  * [new RPCServer(options)](#new-rpcserveroptions)
  * [Event: 'client'](#event-client)
  * [Event: 'error'](#event-error)
  * [Event: 'closing'](#event-closing)
  * [Event: 'close'](#event-close)
  * [server.auth(callback)](#serverauthcallback)
  * [server.listen(port[, host])](#serverlistenport-host)
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
  * [client.identity](#clientid)
  * [client.state](#clientstate)
  * [client.protocol](#clientprotocol)
  * [client.connect()](#clientconnect)
  * [client.close([options])](#clientcloseoptions)
  * [client.handle([method,] handler)](#handlemethod-handler)
  * [client.call(method[, params][, options])](#callmethod-params-options)
  * [client.sendRaw(message)](#clientsendrawmessage)

* [Class: RPCServerClient](#class-rpcserverclient)
  * [client.handshake](#)
  * [client.session](#)

* [createRPCError(type[, message[, details]])](#createrpcerrortype-message-details)

### Class: RPCServer

#### new RPCServer(options)

- `options` {Object}
  - `wssOptions` {Object} - Additional [WebSocketServer options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `Infinity`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings to connected clients. Defaults to `30000`.
  - `endpoint` {String} - The RPC endpoint URL. (begins with `ws://` or `wss://`).
  - `identity` {String} - The self-reported identity of this RPC client.
  - `protocols` {Array<String>} - Array of subprotocols supported by this server. Can be overridden in an [auth](#serverauthcallback) callback. Defaults to `[]`.
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no limit on inbound calls. Defaults to `1`.

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
  * `protocols` {Set} - A set of subprotocols supported by the client.
  * `identity` {String} - The identity portion of the connection URL, decoded.
  * `endpoint` {String} - The endpoint portion of the connection URL. This is the part of the path before the identity.
  * `remoteAddress` {String} - The remote IP address of the socket.
  * `headers` {Object} - The HTTP headers sent in the upgrade request.
  * `request` {http.IncomingMessage} - The full HTTP request received by the underlying webserver.

#### server.listen([port[, host[, options]]])

* `port` {Number} - The port number to listen on. If not set, the operating system will assign an unused port.
* `host` {String} - The host address to bind to. If not set, connections will be accepted on all interfaces.
* `options` {Object}
  * `signal` {AbortSignal} - An `AbortSignal` used to abort the `listen()` call of the underlying `net.Server`.

Creates a simple HTTP server which only accepts websocket upgrades and returns a 404 response to any other request.

Returns a Promise which resolves to an instance of `http.Server`.

#### server.close([options])

* `options` {Object}
  * `code` {Number} - The [WebSocket close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code) to pass to all connected clients. Defaults to `1000`.
  * `reason` {String} - The reason for closure to pass to all connected clients. Defaults to `''`.
  * `awaitPending` {Boolean} - If `true`, each connected client won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime.
  * `force` {Boolean} - If `true`, terminates all client WebSocket connections instantly and uncleanly.

This blocks new clients from connecting, calls [`client.close()`](#clientcloseoptions) on all connected clients, and then finally closes any listening HTTP servers which were created using [`server.listen()`](#serverlistenport-host-options).

### Class: RPCClient

#### new RPCClient(options)

- `options` {Object}
  - `wsOptions` {Object} - Additional [WebSocket options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options).
  - `callTimeoutMs` {Number} - Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to `60000`.
  - `pingIntervalMs` {Number} - Milliseconds between WebSocket pings. Defaults to `30000`.
  - `url` {String} - The WebSocket URL to connect to.
  - `protocols` {Array<String>} - Array of subprotocols supported by this client. Defaults to `[]`.
  - `respondWithDetailedErrors` {Boolean} - Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to `false`.
  - `callConcurrency` {Number} - The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no limit on inbound calls. Defaults to `1`.
  - `reconnect` {Boolean} - If `true`, the client will attempt to reconnect after losing connection to the RPCServer. Only works after making one initial successful connection. Defaults to `true`.
  - `maxReconnects` {Number} - If `reconnect` is `true`, specifies the number of times to try reconnecting before failing an emitting a `close` event. Defaults to `Infinity`
  - `backoff` {Object} - If `reconnect` is `true`, specifies the options for an [ExponentialStrategy](https://github.com/MathieuTurcotte/node-backoff#class-exponentialstrategy) backoff strategy, used for reconnects.

#### Event: 'badMessage'

* `message` {Buffer} - The raw message received by the WebSocket.

Emitted when a message is received by the client which does not conform to the RPC protocol. Immediately after this, the client will be closed with a code of `1002`.

#### Event: 'call'

* `call` {Object}
  * `outbound` {Boolean} - Set to `true` if the call originated locally.
  * `payload` {Array} - The RPC call payload array.

Emitted immediately before a call request is sent, or in the case of an inbound call, immediately before the call is processed.

#### Event: 'close'

* `event` {Object}
  * `code` {Number} - The close code received.
  * `reason` {String} - The reason for the connection closing.

Emitted after `client.close()` completes.

#### Event: 'closing'

Emitted when the client is closing. This event is distinct from `disconnect`.

#### Event: 'connecting'

Emitted when the client is trying to establish a new WebSocket connection. If sucessful, the this should be followed by an `'open'` event.

#### Event: 'disconnect'

* `event` {Object}
  * `code` {Number} - The close code received.
  * `reason` {String} - The reason for the connection closing.

Emitted when the underlying WebSocket has disconnected. If the client is configured to reconnect, this should be followed by a `'connecting'` event, otherwise a `'closing'` event.

#### Event: 'open'

* `response` {http.ServerResponse} - The response to the client's upgrade request.

Emitted when the client is connected to the server and ready to send & receive calls.

#### Event: 'ping'

* `event` {Object}
  * `rtt` {Number} - The round trip time (in milliseconds) between when the ping was sent and the pong was received.

Emitted when the client has received a response to a ping.

#### Event: 'protocol'

* `protocol` {String} - The mutually agreed websocket subprotocol.

Emitted when the client protocol has been set. Once set, this cannot change. Fired no more than once.

#### Event: 'response'

* `response` {Object}
  * `outbound` {Boolean} - Set to `true` if the response originated locally.
  * `payload` {Array} - The RPC response payload array.

Emitted immediately before a response request is sent, or in the case of an inbound response, immediately before the response is processed.

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

Emitted when the client receives a call result or error response for a call it does not recognise (or has already been processed).

The message `type` can be one of the following:

| Value | Message Type |
| ----- | ------------ |
| 3     | Result       |
| 4     | Error        |

#### client.identity

* {String}

The client identity retrieved from the connection URL.

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

If the underlying connection is interrupted while waiting for a response, this method will reject.

It's tempting to set `callTimeoutMs` to `Infinity` but this could be a mistake; If the remote handler never returns a response, the RPC communications will be blocked as soon as `callConcurrency` is exhausted (which is `1` by default). (While this is still an unlikely outcome when using this module for both client *and* server components - interoperability with real world systems can sometimes be unpredictable.)

### Class: RPCServerClient : RPCClient

The RPCServerClient is a subclass of RPCClient. This represents an RPCClient from the server's perspective. It has all the same properties and methods as RPCClient but with a couple of additional properties...

#### client.handshake

* {Object}
  * `protocols` {Set} - A set of subprotocols purportedly supported by the client.
  * `identity` {String} - The identity portion of the connection URL, decoded.
  * `endpoint` {String} - The endpoint portion of the connection URL. This is the part of the path before the identity.
  * `remoteAddress` {String} - The remote IP address of the socket.
  * `headers` {Object} - The HTTP headers sent in the upgrade request.
  * `request` {http.IncomingMessage} - The full HTTP request received by the underlying webserver.

This property holds information collected during the WebSocket connection handshake.

#### client.session

* {*}

This property can be anything. This is the value passed to `accept()` during the authentication callback.

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
* Previously queued messages are sent to the server upon entering this state. RPC calls & responses while in this state are sent to the server after the queue is empty.

**CLOSING**  
* RPC calls while in this state are rejected.
* RPC responses will be silently dropped.

Note: Whenever the underlying websocket loses connection, any in-flight outbound RPC calls are immediately rejected, and the `AbortSignal`s passed to any in-flight inbound RPC calls are aborted.

## TODO

* Add support for TLS Client certs
* Add re-configurable reconnect backoff options
* Add support for signed (JWS) messages

## License

[MIT](LICENSE.md)