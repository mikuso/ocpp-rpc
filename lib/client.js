import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { EventEmitter, on, once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { setTimeout as setTimeoutCb } from 'node:timers';
import WebSocket from 'ws';
import { ExponentialStrategy } from 'backoff';
import { NOREPLY } from './symbols.js';
import { TimeoutError, UnexpectedHttpResponse, RPCFrameworkError, RPCGenericError, RPCError } from './errors.js';
import { getErrorPlainObject, createRPCError, getPackageIdent, lookupOcpp16DeprecatedCode } from './util.js';
import { Queue } from './queue.js';
import standardValidators from './standard-validators.js';
import { isValidStatusCode } from './ws-util.js';
import { getDefaultFeatureSet, getProtocolFeatureSet } from './featuresets.js';

// TODO: can we make this an enum or package it better?
export const CONNECTING = 0;
export const OPEN = 1;
export const CLOSING = 2;
export const CLOSED = 3;

// TODO: can we make this an enum or package it better?
const MSG_CALL = 2;
const MSG_CALLRESULT = 3;
const MSG_CALLERROR = 4;
const MSG_CALLRESULTERROR = 5;
const MSG_SEND = 6;

/**
 * @typedef {[MSG_CALL, string, string, Record<string, *>]} MsgCall
 * Represents the content of a CALL message. (Message Type Id 2)
 */
/**
 * @typedef {[MSG_CALLRESULT, string, Record<string, *>]} MsgCallResult
 * Represents the content of a CALLRESULT message. (Message Type Id 3)
 */

/**
 * @typedef {[MSG_CALLERROR, string, string, string, Record<string, *>]} MsgCallError
 * Represents the content of a CALLERROR message. (Message Type Id 4)
 */

/**
 * @typedef {[MSG_CALLRESULTERROR, string, string, string, Record<string, *>]} MsgCallResultError
 * Represents the content of a CALLRESULTERROR message. (Message Type Id 5)
 */

/**
 * @typedef {[MSG_SEND, string, string, Record<string, *>]} MsgSend
 * Represents the content of a SEND message. (Message Type Id 6)
 */


/**
 * @typedef RPCCallHandlerParams
 * @prop {MSG_CALL | MSG_SEND} typeId The type of message being handled.
 * @prop {string} method The name of the method being invoked (useful for wildcard handlers).
 * @prop {*} params The parameters of the call (or send).
 * @prop {AbortSignal} signal A signal which will abort if the underlying connection is dropped.
 * @prop {string} messageId The OCPP Message ID used in the call.
 * @prop {Function} reply A callback to send a response to the call. Accepts a response value, an Error, or a Promise which resolves to either.
 *   - If a value (or a Promise resolving to a value) is passed, a CALLRESULT is sent.
 *   - If an Error (or a Promise rejecting with an Error) is passed, a CALLERROR is sent.
 *   - If the NOREPLY symbol is passed, no response is sent; you must then send a response
 *     manually (e.g. via sendRaw()).
 */

/**
 * @typedef {(RPCCallHandlerParams) => any} RPCCallHandler
 */

/**
 * @typedef RPCClientOptions
 * @prop {string} endpoint The RPC server's endpoint (a websocket URL). Required.
 * @prop {string} identity The RPC client's identity. Will be automatically percent-encoded when used in the connection URL. Required.
 * @prop {string[]} [protocols=[]] Array of subprotocols supported by this client.
 * @prop {string|Buffer} [password] Optional password to use in HTTP Basic auth. This can be a Buffer to allow for binary passwords. If provided as a string, it will be encoded as UTF-8.
 * @prop {Record<string, string>} [headers={}] Additional HTTP headers to send along with the websocket upgrade request. Must be specified in object form (e.g. `{'X-Custom-Header': 'CustomValue'}`)
 * @prop {Record<string, string>|string} [query=''] An optional query string or object to append as the query string of the connection URL.
 * @prop {number} [callTimeoutMs=60000] Milliseconds to wait before unanswered outbound calls are rejected automatically.
 * @prop {number} [pingIntervalMs=30000] Milliseconds between WebSocket pings. Used for keep-alive timeouts.
 * @prop {boolean} [deferPingsOnActivity=false] Should the client skip sending keep-alive pings if other data is being regularly received? Enabling this option can help reduce data usage (especially on TLS-secured connections), but may cause compatibility issues with some real-world servers as they might treat an absence of pings to mean the connection to the client is lost.
 * @prop {boolean|Array.<string>} [strictMode=false] Enable strict validation of calls & responses. Pass an array of subprotocol names to limit strict mode to specific protocols.
 * @prop {Array.<Validator>} [strictModeValidators=[]] Optional additional validators to be used in conjunction with strictMode.
 * @prop {boolean} [respondWithDetailedErrors=false] Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. This may be undesirable in a production environment as it leaks the call stack of the handler.
 * @prop {number} [callConcurrency=1] The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no concurrency limit imposed on inbound calls. OCPP requires this to be set to `1`, but you may choose other values for non-OCPP/custom protocols.
 * @prop {boolean} [reconnect=true] If true, the client will attempt to reconnect after losing connection to the RPCServer. Only applies after making one initial successful connection.
 * @prop {number} [maxReconnects=Infinity] If reconnect is true, specifies the number of times to try reconnecting before failing and emitting a 'close' event.
 * @prop {object} [backoff] If reconnect is true, specifies the options for an ExponentialStrategy backoff strategy.
 * @prop {number} [backoff.initialDelay=1000] Initial delay in milliseconds before first reconnect attempt.
 * @prop {number} [backoff.maxDelay=10000] Maximum delay in milliseconds between reconnect attempts.
 * @prop {number} [backoff.factor=2] Factor by which the delay increases after each attempt.
 * @prop {number} [backoff.randomisationFactor=0.25] Randomisation factor to add jitter to reconnect delays.
 * @prop {number} [maxBadMessages=Infinity] The maximum number of non-conforming RPC messages which can be tolerated before the client is automatically closed. // TODO: identify if the socket will reconnect after or not (and then document this behaviour)
 * @prop {WebSocket.ClientOptions} [wsOpts={}] Additional [WebSocket options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketaddress-protocols-options).
 */

/**
 * @typedef {RPCClient.CONNECTING | RPCClient.OPEN | RPCClient.CLOSING | RPCClient.CLOSED} ConnectionState
 * Represents the current state of a WebSocket connection.
 * The four possible values correspond to the WebSocket ready state constants:
 * - `RPCClient.CONNECTING` - The connection is being established.
 * - `RPCClient.OPEN` - The connection is open and ready to communicate.
 * - `RPCClient.CLOSING` - The connection is in the process of closing.
 * - `RPCClient.CLOSED` - The connection is closed or could not be opened.
 */

/**
 * @group Classes
 */
export class RPCClient extends EventEmitter {

    /**
     * Emitted when the client is trying to establish a new WebSocket connection. If successful,
     * this will be followed by an 'open' event.
     * @event
     * @overload
     * @param {'connecting'} event
     * @param {(data: {protocols: string[]}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the client has successfully connected and is ready to send & receive calls.
     * @event
     * @overload
     * @param {'open'} event
     * @param {(data: {response: import('http').IncomingMessage}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the underlying WebSocket has disconnected. If the client is configured to
     * reconnect, this is followed by a 'connecting' event, otherwise a 'closing' event.
     * @event
     * @overload
     * @param {'disconnect'} event
     * @param {(data: {code: number, reason: string}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted after client.close() completes. Will not be emitted if the client reconnects.
     * @event
     * @overload
     * @param {'close'} event
     * @param {(data: {code: number, reason: string}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the client is closing and does not plan to reconnect.
     * @event
     * @overload
     * @param {'closing'} event
     * @param {() => void} listener
     * @returns {this}
     */
    /**
     * Emitted whenever a message is sent or received over the client's WebSocket.
     * Useful for logging or debugging. To handle and respond to a call, use client.handle() instead.
     * @event
     * @overload
     * @param {'message'} event
     * @param {(data: {message: Buffer|string, outbound: boolean}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately before an outbound CALL is sent, or immediately before an inbound CALL
     * is processed. Useful for logging or debugging.
     * 
     * In order to handle and respond to the call, you should use client.handle() instead.
     * @event
     * @overload
     * @param {'call'} event
     * @param {(data: {messageId: string, outbound: boolean, payload: Array}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately after a CALLRESULT is sent or received.
     * @event
     * @overload
     * @param {'callResult'} event
     * @param {(data: {messageId: string, outbound: boolean, method: string, params: object, result: object}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately after a CALLERROR is sent or received, and also upon any call
     * rejection including timeouts, abort signals, and connection interruptions.
     * Will NOT be emitted if `{noReply: true}` option was used on the call.
     * @event
     * @overload
     * @param {'callError'} event
     * @param {(data: {messageId: string, outbound: boolean, method: string, params: object, error: RPCError|Error}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately after a CALLRESULTERROR is sent or received.
     * @event
     * @overload
     * @param {'callResultError'} event
     * @param {(data: {messageId: string, outbound: boolean, error: RPCError}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately before an outbound response is sent, or immediately before an inbound
     * response is processed. Useful for logging or debugging.
     * @event
     * @overload
     * @param {'response'} event
     * @param {(data: {outbound: boolean, payload: Array}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the client has received a response (pong) to a ping.
     * @event
     * @overload
     * @param {'ping'} event
     * @param {(data: {rtt: number}) => void} listener
     * @returns {this}
     */
    /**
     * The mutually agreed websocket subprotocol. Emitted when the client protocol has been set.
     * Once set, this cannot change. This event only fires once per connect() call.
     * @event
     * @overload
     * @param {'protocol'} event
     * @param {(protocol: string) => void} listener
     * @returns {this}
     */
    /**
     * Emitted for low-level errors such as socket errors or fundamental processing errors. You should attach a listener to this event or else these errors will propagate as warnings on the console instead.
     * @event
     * @overload
     * @param {'error'} event
     * @param {(error: Error) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the underlying WebSocket instance fires an 'error' event.
     * @deprecated Socket errors are now available through the general 'error' event instead. In a future version, the 'socketError' event will be removed.
     * @event
     * @overload
     * @param {'socketError'} event
     * @param {(error: Error) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when a "bad message" is received - one which does not structurally conform to the
     * RPC protocol or violates some other principle of the framework. If appropriate, the client
     * will respond with a "RpcFrameworkError" or similar error code. If too many bad messages are
     * received in succession (per the maxBadMessages option), the client is closed with code 1002.
     * @event
     * @overload
     * @param {'badMessage'} event
     * @param {(data: {buffer: Buffer, error: Error, response: MsgCallError|null}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted in strict mode when an inbound call or outbound response fails schema validation.
     * @event
     * @overload
     * @param {'strictValidationFailure'} event
     * @param {(data: {error: Error, messageId: string, method: string, params: object, result: object|null, outbound: boolean, isCall: boolean}) => void} listener
     * @returns {this}
     */
    /**
     * @overload
     * @param {string} event
     * @param {(...args: any[]) => void} listener
     * @returns {this}
     */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Creates a new RPCClient instance.
     * @param {RPCClientOptions} options
     */
    constructor(options) {
        super();

        /** @internal @private */
        this._identity = undefined;
        /** @internal @private */
        this._wildcardHandler = null;
        /** @internal @private @type {Map<string, RPCCallHandler>} */
        this._handlers = new Map();

        /** @internal @type {ConnectionState} */
        this._state = CLOSED;
        
        /** @internal @private */
        this._outboundCallQueue = new Queue();
        
        /** @internal @private */
        this._ws = undefined;
        /** @internal @private */
        this._wsAbortController = undefined;
        /** @internal @private */
        this._keepAliveAbortController = undefined;
        /** @internal @private */
        this._pendingPingResponse = false;
        /** @internal @private */
        this._lastPingTime = 0;
        /** @internal @private */
        this._closePromise = undefined;
        /** @internal @private @type {string[]} */
        this._protocolOptions = [];
        /** @internal @private */
        this._protocol = undefined;
        /** @internal @private */
        this._featureset = getDefaultFeatureSet();
        /** @internal @private @type {Map<string, Function>} */
        this._protocolClientHandlers = new Map();
        /** @internal @private @type {string[]} */
        this._strictProtocols = [];
        /** @internal @private */
        this._strictValidators = undefined;

        /** @internal @private */
        this._pendingCalls = new Map();
        /** @internal @private */
        this._pendingResponses = new Map();
        /** @internal @private @type {Array.<string|Buffer>} */
        this._outboundMsgBuffer = [];
        /** @internal @private */
        this._connectedOnce = false;
        
        /** @internal @private */
        this._backoffStrategy = undefined;
        /** @internal @private */
        this._badMessagesCount = 0;
        /** @internal @private */
        this._reconnectAttempt = 0;
        /** @internal @private */
        this._connectionUrl = undefined;
        /** @internal @private */
        this._connectPromise = undefined;
        /** @internal @private */
        this._nextPingTimeout = undefined;

        /** @internal @private */
        this._options = {
            password: null,
            callTimeoutMs: 1000*60,
            pingIntervalMs: 1000*30,
            deferPingsOnActivity: false,
            wsOpts: {},
            headers: {},
            protocols: [],
            reconnect: true,
            maxReconnects: Infinity,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
            maxBadMessages: Infinity,
            strictMode: false,
            strictModeValidators: [],
            backoff: {
                initialDelay: 1000,
                maxDelay: 10*1000,
                factor: 2,
                randomisationFactor: 0.25,
            }
        };

        this.reconfigure(options || {});
    }

    /**
     * The client's identity.
     * @type {string}
     */
    get identity() {
        return this._identity;
    }

    /**
     * The agreed subprotocol. Once connected for the first time, this subprotocol becomes fixed
     * and will be expected upon automatic reconnects.
     * @type {string}
     */
    get protocol() {
        return this._protocol;
    }

    /**
     * The client's current connection state.
     * @type {ConnectionState}
     */
    get state() {
        return this._state;
    }

    /**
     * Use this method to change any of the options that can be passed to the RPCClient's constructor.
     * When changing identity, the RPCClient must be explicitly close()d and then connect()ed for the change to take effect.
     *
     * @param {Omit<RPCClientOptions, 'identity'> & Partial<Pick<RPCClientOptions, 'identity'>>} options
     */
    reconfigure(options) {
        const newOpts = Object.assign(this._options, options);

        if (!newOpts.identity) {
            throw Error(`'identity' is required`);
        }

        if (newOpts.strictMode && !newOpts.protocols?.length) {
            throw Error(`strictMode requires at least one subprotocol`);
        }

        const strictValidators = [...standardValidators];
        if (newOpts.strictModeValidators) {
            strictValidators.push(...newOpts.strictModeValidators);
        }

        this._strictValidators = strictValidators.reduce((svs, v) => {
            svs.set(v.subprotocol, v);
            return svs;
        }, new Map());
        
        this._strictProtocols = [];
        if (Array.isArray(newOpts.strictMode)) {
            this._strictProtocols = newOpts.strictMode;
        } else if (newOpts.strictMode) {
            this._strictProtocols = newOpts.protocols;
        }

        const missingValidator = this._strictProtocols.find(protocol => !this._strictValidators.has(protocol));
        if (missingValidator) {
            throw Error(`Missing strictMode validator for subprotocol '${missingValidator}'`);
        }

        this._outboundCallQueue.setConcurrency(newOpts.callConcurrency);
        this._backoffStrategy = new ExponentialStrategy(newOpts.backoff);

        if ('pingIntervalMs' in options) {
            this._keepAlive();
        }
    }

    /**
     * Attempt to connect to the RPCServer specified in options.endpoint.
     *
     * - If already OPEN, this is a no-op and resolves immediately with `undefined`.
     * - If already CONNECTING, returns the existing connect promise.
     * - If in CLOSING state, throws immediately.
     *
     * @returns {Promise.<{response: http.IncomingMessage}|undefined>} Resolves with
     *   an object containing `response` (the server's HTTP upgrade response as an `IncomingMessage`)
     *   on first successful connection, `undefined` if already OPEN, or rejects on failure.
     */
    async connect() {
        this._protocolOptions = this._options.protocols ?? [];
        this._protocol = undefined;
        this._identity = this._options.identity;
        
        let connUrl = this._options.endpoint + '/' + encodeURIComponent(this._options.identity);
        if (this._options.query) {
            const searchParams = new URLSearchParams(this._options.query);
            connUrl += '?' + searchParams.toString();
        }

        this._connectionUrl = connUrl;

        if (this._state === CLOSING) {
            throw Error(`Cannot connect while closing`);
        }

        if (this._state === OPEN) {
            // no-op
            return;
        }

        if (this._state === CONNECTING) {
            return this._connectPromise;
        }

        try {
            return await this._beginConnect();
        } catch (err) {

            this._state = CLOSED;
            this.emit('close', {code: 1006, reason: "Abnormal Closure"});
            throw err;
        }
    }

    /**
     * Registers a callback to be invoked once the client has connected and negotiated the given protocol.
     *
     * @param {string} protocol - The protocol identifier string (e.g. `'ocpp1.6'`).
     * @param {(cli: RPCClient) => void} callback - Called after the
     *   connection is established with the negotiated protocol.
     */
    with(protocol, callback) {
        this._protocolClientHandlers.set(protocol, callback);
    }

    /**
     * Send arbitrary data across the websocket. Not intended for general use.
     * While socket is CONNECTING, the message is queued and sent when open.
     * While socket is OPEN or CLOSING, sends immediately.
     * Throws if the socket is CLOSED.
     * @param {Array|Number|Object|String|ArrayBuffer|Buffer|DataView|TypedArray} message - A raw message to send across the WebSocket.
     */
    sendRaw(message) {
        if ([OPEN, CLOSING].includes(this._state) && this._ws) {
            // can send while closing so long as websocket doesn't mind
            this._ws.send(message);
            this.emit('message', {message, outbound: true});
        } else if (this._state === CONNECTING) {
            this._outboundMsgBuffer.push(message);
        } else {
            throw Error(`Cannot send message in this state`);
        }
    }

    /**
     * Closes the underlying connection. Unless awaitPending is true, all in-flight outbound calls
     * will be instantly rejected and any inbound calls in process will have their signal aborted.
     * Unless force is true, close() will wait until all calls are settled before returning the
     * final code and reason for closure.
     *
     * The final resolved code & reason may differ from what was requested:
     * - If close() is called twice, the first code is canonical.
     * - If close() is called while still in the CONNECTING state during the very first connect
     *   attempt, the resolved code will always be `1001` with reason `'Connection aborted'`.
     * - If force=true, the underlying WebSocket is terminated uncleanly; the actual close
     *   code reported by the system will typically be `1006` (Abnormal Closure).
     *
     * @param {Object} [options] - Close options
     * @param {number} [options.code=1000] - The websocket CloseEvent code.
     * @param {string} [options.reason=''] - The websocket CloseEvent reason.
     * @param {boolean} [options.awaitPending=false] - Wait for all in-flight inbound and outbound calls & responses to complete before closing. Additional calls will be rejected in the meantime.
     * @param {boolean} [options.force=false] - Terminate websocket immediately without passing code, reason, or waiting.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code CloseEvent codes}
     * @returns {Promise<{code: number, reason: string}>} The CloseEvent (code & reason) for closure.
     */
    async close({code, reason, awaitPending, force} = {}) {
        if ([CLOSED, CLOSING].includes(this._state)) {
            // no-op
            return this._closePromise;
        }

        if (this._state === OPEN) {
            this._closePromise = (async () => {

                if (force || !awaitPending) {
                    // reject pending calls
                    this._rejectPendingCalls("Client going away");
                }

                if (force) {
                    this._ws.terminate();
                } else {
                    // await pending calls & responses
                    await this._awaitUntilPendingSettled();
                    if (!code || !isValidStatusCode(code)) {
                        code = 1000;
                    }
                    this._ws.close(code, reason);
                }

                let [codeRes, reasonRes] = await once(this._ws, 'close');

                if (reasonRes instanceof Buffer) {
                    reasonRes = reasonRes.toString('utf8');
                }

                return {code: codeRes, reason: reasonRes};
                
            })();

            this._state = CLOSING;
            this._connectedOnce = false;
            this.emit('closing');
    
            return this._closePromise;

        } else if (this._wsAbortController) {

            const result = this._connectedOnce ?
                {code, reason} :
                {code: 1001, reason: "Connection aborted"};

            this._wsAbortController.abort();
            this._state = CLOSED;
            this._connectedOnce = false;
            this.emit('close', result);
            return result;
        }
    }

    /**
     * Registers a call handler. Only one "wildcard" handler can be registered at once. Likewise,
     * attempting to register a handler for a method which is already being handled will override
     * the former handler.
     * 
     * Calling reply() more than once, or returning/throwing after calling reply(), is a no-op.
     * If the handler returns or throws before reply() is called, reply() is called implicitly
     * with the returned value or thrown Error.
     *
     * @param {string} [method] - The name of the RPC method to handle. If not provided, acts as a "wildcard" handler.
     * @param {RPCCallHandler} handler - A function that can handle incoming calls for this method.
     * 
     * @example Handling an OCPP Heartbeat
     * ```
     * client.handle('Heartbeat', ({reply}) => {
     *     reply({ currentTime: new Date().toISOString() });
     * });
     * 
     * // or...
     * client.handle('Heartbeat', () => {
     *     return { currentTime: new Date().toISOString() };
     * });
     * ```
     * 
     * @example Using NOREPLY
     * ```
     * import { NOREPLY } from 'ocpp-rpc';
     * 
     * client.handle('WontReply', ({reply}) => {
     *     reply(NOREPLY);
     * });
     * 
     * // or...
     * client.handle('WontReply', () => {
     *     return NOREPLY;
     * });
     * ```
     */
    handle(method, handler) {
        if (method instanceof Function && !handler) {
            this._wildcardHandler = method;
        } else {
            this._handlers.set(method, handler);
        }
    }

    /**
     * Unregisters a call handler. If no method name is provided, it will unregister the wildcard handler instead.
     *
     * @param {string} [method] - The name of the handled method. If null or undefined, unregisters the wildcard handler.
     */
    removeHandler(method) {
        if (method == null) {
            this._wildcardHandler = null;
        } else {
            this._handlers.delete(method);
        }
    }

    /**
     * Unregisters all previously-registered call handlers (including wildcard handler if set).
     */
    removeAllHandlers() {
        this._wildcardHandler = null;
        this._handlers.clear();
    }

    /**
     * 
     * @param {string} method 
     * @param {object} [params] 
     * @returns {void}
     */
    send(method, params = {}) {
        if ([CLOSED, CLOSING].includes(this._state)) {
            throw Error(`Cannot send while socket not open`);
        }

        const msgId = randomUUID();
        const payload = [MSG_SEND, msgId, method, params];

        if (this._strictProtocols.includes(this._protocol)) {
            // perform some strict-mode checks
            const validator = this._strictValidators.get(this._protocol);
            try {
                validator.validate(validator.getBaseId(method), params);
            } catch (error) {
                this.emit('strictValidationFailure', {
                    messageId: msgId,
                    method,
                    params,
                    result: null,
                    error,
                    outbound: true,
                    isCall: true,
                });
                throw error;
            }
        }

        this.emit('send', {outbound: true, payload});
        this.sendRaw(JSON.stringify(payload));
    }

    /**
     * Call a method on a remote RPCClient or RPCServerClient.
     *
     * Returns a Promise which resolves with the result from the remote handler, or rejects with
     * an error (including timeouts, connection interruptions, and RPC errors from the remote party).
     *
     * A `'callError'` event is emitted for all rejections, including timeouts and connection
     * interruptions.
     *
     * Note: it is tempting to set `callTimeoutMs` to `Infinity`, but this risks blocking RPC
     * communications permanently once `callConcurrency` is exhausted if the remote never responds.
     *
     * @param {string} method - The RPC method to call.
     * @param {object} [params] - A value to be passed as params to the remote handler.
     * @param {object} [options] - Call options
     * @param {number} [options.callTimeoutMs] - Call timeout (in milliseconds). Defaults to the same value as the option passed to the client/server constructor.
     * @param {AbortSignal} [options.signal] - AbortSignal to cancel the call.
     * @param {boolean} [options.noReply=false] - Send call without expecting a response, resolving immediately with `undefined`. If a response is received, a `badMessage` event will be emitted instead. Note: `callError` is NOT emitted when using noReply.
     * @returns {Promise<*>} Response value from the remote handler.
     */
    async call(method, params = {}, options = {}) {
        return await this._outboundCallQueue.push(this._call.bind(this, method, params, options));
    }

    /** @internal @private */
    async _call(method, params, options = {}) {
        const timeoutMs = options.callTimeoutMs ?? this._options.callTimeoutMs;

        if ([CLOSED, CLOSING].includes(this._state)) {
            throw Error(`Cannot make call while socket not open`);
        }

        const msgId = randomUUID();
        const payload = [MSG_CALL, msgId, method, params];

        if (this._strictProtocols.includes(this._protocol)) {
            // perform some strict-mode checks
            const validator = this._strictValidators.get(this._protocol);
            try {
                validator.validate(validator.getRequestId(method), params);
            } catch (error) {
                this.emit('strictValidationFailure', {
                    messageId: msgId,
                    method,
                    params,
                    result: null,
                    error,
                    outbound: true,
                    isCall: true,
                });
                throw error;
            }
        }

        const pendingCall = {msgId, method, params};

        if (!options.noReply) {
            const timeoutAc = new AbortController();

            const cleanup = () => {
                if (pendingCall.timeout) {
                    timeoutAc.abort();
                }
                this._pendingCalls.delete(msgId);
            };
            
            pendingCall.abort = (reason) => {
                const err = Error(reason);
                err.name = "AbortError";
                pendingCall.reject(err);
            };

            if (options.signal) {
                once(options.signal, 'abort').then(() => {
                    pendingCall.abort(options.signal.reason);
                });
            }

            pendingCall.promise = new Promise((resolve, reject) => {
                pendingCall.resolve = (...args) => {
                    cleanup();
                    resolve(...args);
                };
                pendingCall.reject = (...args) => {
                    cleanup();
                    reject(...args);
                };
            });

            if (timeoutMs && timeoutMs > 0 && timeoutMs < Infinity) {
                const timeoutError = new TimeoutError("Call timeout");
                pendingCall.timeout = setTimeout(timeoutMs, null, {signal: timeoutAc.signal}).then(() => {
                    pendingCall.reject(timeoutError);
                }).catch(err=>{});
            }

            this._pendingCalls.set(msgId, pendingCall);
        }

        this.emit('call', {outbound: true, payload});
        this.sendRaw(JSON.stringify(payload));

        if (options.noReply) {
            return;
        }

        try {
            const result = await pendingCall.promise;

            this.emit('callResult', {
                outbound: true,
                messageId: msgId,
                method,
                params,
                result,
            });

            return result;

        } catch (err) {
            // 'callError' is emitted for all rejections, including timeouts, abort signals,
            // and connection interruptions - not just CALLERROR responses from the remote party.
            this.emit('callError', {
                outbound: true,
                messageId: msgId,
                method,
                params,
                error: err,
            });

            throw err;
        }
    }

    /**
     * Start consuming from a WebSocket
     * @internal
     * @private
     * @param {WebSocket} ws - A WebSocket instance
     * @param {AsyncIterator<Buffer>} messageAsyncIterator 
     */
    _attachWebsocket(ws, messageAsyncIterator) {
        ws.once('close', (code, reason) => {
            return this._handleDisconnect({code, reason});
        });
        ws.on('error', (err) => {
            this._logError(err);
            return this.emit('socketError', err);
        });
        ws.on('ping', () => {
            if (this._options.deferPingsOnActivity) {
                this._deferNextPing();
            }
        });
        ws.on('pong', () => {
            if (this._options.deferPingsOnActivity) {
                this._deferNextPing();
            }
            this._pendingPingResponse = false;
            const rtt = Date.now() - this._lastPingTime;
            this.emit('ping', {rtt});
        });

        this._keepAlive();

        process.nextTick(async () => {
            const concurrencyLimit = 16;

            // create an array of message-processing promises which eat the message async iterator
            await Array.from({ length: concurrencyLimit }, async () => {
                try {
                    for await (const [msg] of messageAsyncIterator) {
                        try {
                            await this._onMessage(msg);
                        } catch (err) {
                            const error = Error(`Message processor failed`, {cause: err});
                            error.payload = msg;
                            this._logError(error);
                        }
                    }
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        this._logError(Error(`Message consumer aborted early`, {cause: err}));
                    }
                }
            });

            // all iterators terminate after websocket closed
        });
    }

    /** @internal @private */
    _rejectPendingCalls(abortReason) {
        const pendingCalls = Array.from(this._pendingCalls.values());
        const pendingResponses = Array.from(this._pendingResponses.values());
        [...pendingCalls, ...pendingResponses].forEach(c => c.abort(abortReason));
    }

    /** @internal @private */
    async _awaitUntilPendingSettled() {
        const pendingCalls = Array.from(this._pendingCalls.values());
        const pendingResponses = Array.from(this._pendingResponses.values());
        return await Promise.allSettled([
            ...pendingResponses.map(c => c.promise),
            ...pendingCalls.map(c => c.promise),
            this._outboundCallQueue.waitForEmpty({signal: this._wsAbortController.signal}),
        ]);
    }

    /** @internal @private */
    _handleDisconnect({code, reason}) {
        if (reason instanceof Buffer) {
            reason = reason.toString('utf8');
        }

        // reject any outstanding calls/responses
        this._rejectPendingCalls("Client disconnected");
        this._keepAliveAbortController?.abort();

        this.emit('disconnect', {code, reason});

        if (this._state === CLOSED) {
            // nothing to do here
            return;
        }

        if (this._state !== CLOSING && this._options.reconnect) {

            this._tryReconnect();

        } else {

            this._state = CLOSED;
            this.emit('close', {code, reason});
        }
    }

    /** @internal @private */
    _beginConnect() {
        this._connectPromise = (async () => {
            this._wsAbortController = new AbortController();

            const wsOpts = Object.assign({
                // defaults
                noDelay: true,
                signal: this._wsAbortController.signal,
                headers: {
                    'user-agent': getPackageIdent()
                },
            }, this._options.wsOpts ?? {});

            Object.assign(wsOpts.headers, this._options.headers);

            if (this._options.password != null) {
                const usernameBuffer = Buffer.from(this._identity + ':');
                let passwordBuffer = this._options.password;
                if (typeof passwordBuffer === 'string') {
                    passwordBuffer = Buffer.from(passwordBuffer, 'utf8');
                }

                const b64 = Buffer.concat([usernameBuffer, passwordBuffer]).toString('base64');
                wsOpts.headers.authorization = 'Basic ' + b64;
            }

            this._ws = new WebSocket(
                this._connectionUrl,
                this._protocolOptions,
                wsOpts,
            );
    
            const consumerAbortController = new AbortController();
            const messageAsyncIterator = on(this._ws, 'message', {signal: consumerAbortController.signal});
            this._ws.once('close', (code, reason) => {
                consumerAbortController.abort();
            });

            let upgradeResponse;

            try {
                await new Promise((resolve, reject) => {
                    this._ws.once('unexpected-response', (request, response) => {
                        const err = new UnexpectedHttpResponse(response.statusMessage, {
                            code: response.statusCode,
                            request,
                            response,
                        });
                        reject(err);
                    });
                    this._ws.once('upgrade', (response) => {
                        upgradeResponse = response;
                    });
                    this._ws.once('error', err => reject(err));
                    this._ws.once('open', () => resolve());
                });

                // record which protocol was selected
                if (this._protocol === undefined) {
                    this._protocol = this._ws.protocol;
                    this._featureset = getProtocolFeatureSet(this._ws.protocol);
                    this.emit('protocol', this._protocol);
                }

                // limit protocol options in case of future reconnect
                this._protocolOptions = this._protocol ? [this._protocol] : [];

                this._reconnectAttempt = 0;
                this._backoffStrategy.reset();
                this._state = OPEN;
                this._connectedOnce = true;
                this._pendingPingResponse = false;
                
                this._attachWebsocket(this._ws, messageAsyncIterator);

                // send queued messages
                if (this._outboundMsgBuffer.length > 0) {
                    const buff = this._outboundMsgBuffer;
                    this._outboundMsgBuffer = [];
                    buff.forEach(msg => this.sendRaw(msg));
                }

                const result = {
                    response: upgradeResponse
                };

                this.emit('open', result);
                this._protocolClientHandlers.get(this._protocol)?.(this);
                return result;
                
            } catch (err) {

                this._ws.terminate();
                if (upgradeResponse) {
                    err.upgrade = upgradeResponse;
                }
                throw err;
            }
            
        })();

        this._state = CONNECTING;
        // Emits 'connecting' with {protocols: string[]} - the list of subprotocols being offered.
        this.emit('connecting', {protocols: this._protocolOptions});

        return this._connectPromise;
    }

    /** @internal @private */
    _deferNextPing() {
        if (!this._nextPingTimeout) {
            return;
        }

        this._nextPingTimeout.refresh();
    }

    /** @internal @private */
    async _keepAlive() {
        // abort any previously running keepAlive
        this._keepAliveAbortController?.abort();
        
        const timerEmitter = new EventEmitter();
        const nextPingTimeout = setTimeoutCb(()=>{
            timerEmitter.emit('next')
        }, this._options.pingIntervalMs);
        this._nextPingTimeout = nextPingTimeout;

        try {
            if (this._state !== OPEN) {
                // don't start pinging if connection not open
                return;
            }

            if (!this._options.pingIntervalMs || this._options.pingIntervalMs <= 0 || this._options.pingIntervalMs > 2147483647) {
                // don't ping for unusuable intervals
                return;
            }
            
            // setup new abort controller
            this._keepAliveAbortController = new AbortController();
            
            while (true) {
                await once(timerEmitter, 'next', {signal: this._keepAliveAbortController.signal}),
                this._keepAliveAbortController.signal.throwIfAborted();

                if (this._state !== OPEN) {
                    // keepalive no longer required
                    break;
                }

                if (this._pendingPingResponse) {
                    // we didn't get a response to our last ping
                    throw Error("Ping timeout");
                }

                this._lastPingTime = Date.now();
                this._pendingPingResponse = true;                
                this._ws.ping();
                nextPingTimeout.refresh();
            }

        } catch (err) {
            // console.log('keepalive failed', err);
            if (err.name !== 'AbortError') {
                // throws on ws.ping() error
                this._ws.terminate();
            }
        } finally {
            clearTimeout(nextPingTimeout);
        }
    }

    /** @internal @private */
    async _tryReconnect() {
        this._reconnectAttempt++;
        if (this._reconnectAttempt > this._options.maxReconnects) {
            // give up
            this.close({code: 1001, reason: "Giving up"});
        } else {
            
            try {
                this._state = CONNECTING;
                const delay = this._backoffStrategy.next();
                await setTimeout(delay, null, {signal: this._wsAbortController.signal});
                
                await this._beginConnect().catch(async (err) => {

                    // This may look hacky - but these error codes are covered under the ws test suite.
                    const intolerableErrors = [
                        /** @see {@link https://github.com/websockets/ws/blob/d9b89544e627f2a260fb85a6f42c8ecba98d7615/test/websocket.test.js#L1501} */
                        'Maximum redirects exceeded',

                        /** @see {@link https://github.com/websockets/ws/blob/d9b89544e627f2a260fb85a6f42c8ecba98d7615/test/websocket.test.js#L1409} */
                        'Server sent no subprotocol',

                        /** @see {@link https://github.com/websockets/ws/blob/d9b89544e627f2a260fb85a6f42c8ecba98d7615/test/websocket.test.js#L1360} */
                        'Server sent an invalid subprotocol',

                        /** @see {@link https://github.com/websockets/ws/blob/d9b89544e627f2a260fb85a6f42c8ecba98d7615/test/websocket.test.js#L1340} */
                        'Server sent a subprotocol but none was requested',

                        /** @see {@link https://github.com/websockets/ws/blob/d9b89544e627f2a260fb85a6f42c8ecba98d7615/test/websocket.test.js#L1049} */
                        'Invalid Sec-WebSocket-Accept header',
                    ];

                    if (intolerableErrors.includes(err.message)) {
                        throw err;
                    }

                    this._tryReconnect();

                }).catch(err => {

                    this.close({code: 1001, reason: err.message});

                });
            } catch (err) {
                // aborted timeout
                return;
            }
        }
    }

    /**
     * @internal
     * @private
     * @param {Buffer} buffer 
     * @returns {Promise<void>}
     */
    async _onMessage(buffer) {
        if (this._options.deferPingsOnActivity) {
            this._deferNextPing();
        }

        const message = buffer.toString('utf8');

        if (!message.length) {
            // ignore empty messages
            // for compatibility with some particular charge point vendors (naming no names)
            return;
        }

        try {
            this.emit('message', {message, outbound: false});
        } catch (err) {
            this._logError(Error("Uncaught error thrown in 'message' event listener", {cause: err}));
        }

        let msgId = '-1';
        let messageType;
        
        /** @type {MsgCallResult | MsgCallError | MsgCallResultError | null} */
        let response = null;

        try {
            let payload;
            try {
                payload = JSON.parse(message);
            } catch (err) {
                throw createRPCError("RpcFrameworkError", "Message must be a JSON structure", {});
            }

            if (!Array.isArray(payload)) {
                throw createRPCError("RpcFrameworkError", "Message must be an array", {});
            }

            const [messageTypePart, msgIdPart, ...more] = payload;

            if (typeof messageTypePart !== 'number') {
                throw createRPCError("RpcFrameworkError", "Message type must be a number", {});
            }

            messageType = messageTypePart;

            if (typeof msgIdPart !== 'string') {
                throw createRPCError("RpcFrameworkError", "Message ID must be a string", {});
            }

            msgId = msgIdPart;

            if (msgId.length > 36) {
                throw createRPCError("RpcFrameworkError", "Message ID is too long", {});
            }
            
            switch (messageType) {
                case MSG_SEND: {
                    if (!this._featureset.enableSend) {
                        throw createRPCError("MessageTypeNotSupported", `Unsupported message type: ${messageType}`);
                    }
                    const [method, params] = more;
                    if (typeof method !== 'string') {
                        throw createRPCError("RpcFrameworkError", "Method must be a string");
                    }
                    this.emit('send', {outbound: false, payload});
                    await this._onSend(msgId, method, params);
                    break;
                }
                case MSG_CALL: {
                    const [method, params] = more;
                    if (typeof method !== 'string') {
                        throw createRPCError("RpcFrameworkError", "Method must be a string");
                    }
                    this.emit('call', {outbound: false, payload});
                    response = await this._onCall(msgId, method, params);
                    break;
                }
                case MSG_CALLRESULT: {
                    const [result] = more;
                    this.emit('response', {outbound: false, payload});
                    this._onCallResult(msgId, result);
                    break;
                }
                case MSG_CALLERROR: {
                    const [errorCode, errorDescription, errorDetails] = more;
                    // TODO: check that the errorCode is valid (in the list). If not, we should ignore the message and treat it as a badMessage
                    this.emit('response', {outbound: false, payload});
                    this._onCallError(msgId, errorCode, errorDescription, errorDetails);
                    break;
                }
                case MSG_CALLRESULTERROR: {
                    if (!this._featureset.enableCallResultError) {
                        throw createRPCError("MessageTypeNotSupported", `Unsupported message type: ${messageType}`);
                    }
                    const [errorCode, errorDescription, errorDetails] = more;
                    // TODO: check that the errorCode is valid (in the list). If not, we should ignore the message and treat it as a badMessage
                    this.emit('response', {outbound: false, payload});
                    this._onCallResultError(msgId, errorCode, errorDescription, errorDetails);
                    break;
                }
                default:
                    throw createRPCError("MessageTypeNotSupported", `Unsupported message type: ${messageType}`);
            }

            this._badMessagesCount = 0;

        } catch (error) {
            
            let errorMessage = error.message || error.rpcErrorMessage || "";;

            const details = error.details ??
                (this._options.respondWithDetailedErrors ? getErrorPlainObject(error) : {});
            

            let rpcErrorCode = error.rpcErrorCode ?? 'GenericError';

            if (this._featureset.enableOcpp16DeprecatedErrorCodes) {
                const substituteErrorCode = lookupOcpp16DeprecatedCode(rpcErrorCode);
                if (substituteErrorCode) {
                    rpcErrorCode = substituteErrorCode;
                }
            }

            switch (messageType) {
                case MSG_CALL: {
                    // If a CALL handler throws, we reply with with a CALLERROR
                    response = [
                        MSG_CALLERROR,
                        msgId,
                        rpcErrorCode,
                        errorMessage,
                        details ?? {},
                    ];
                    break;
                }
                case MSG_CALLRESULT: {
                    // if a CALLRESULT validator throws, we reply with a CALLRESULTERROR
                    response = [
                        MSG_CALLRESULTERROR,
                        msgId,
                        rpcErrorCode,
                        errorMessage,
                        details ?? {},
                    ];
                    break;
                }
                default: {
                    // We can't respond to any other message type
                }
            }
            
            if (error instanceof RPCFrameworkError) {
                // This message failed the RPC framework validation checks.

                this.emit('badMessage', {buffer, error, response});
                
                // We close the connection if we receive too many invalid RPC messages.
                const shouldClose = ++this._badMessagesCount > this._options.maxBadMessages;

                if (shouldClose) {
                    this.close({
                        code: 1002,
                        reason: (error instanceof RPCGenericError) ? errorMessage : "Protocol error"
                    });
                }
            } else {
                // This error was a validation or handling error, rather than a fundamental broken framework message.
                // In these cases, we emit the error as a client event.
                // TODO: document this. also maybe add more context for the error.
                // TODO: if name changes - be sure to update upgrading.md which already references this event
                this.emit('messageHandlingError', error);
            }

        } finally {
            if (response && [OPEN, CLOSING].includes(this._state)) {
                this.emit('response', {outbound: true, payload: response});
                this.sendRaw(JSON.stringify(response));
            }
        }
    }

    /**
     * Internal method called when a SEND message is received.
     * It validates and calls the handler (if exists).
     * If validator or handler throws, 
     * 
     * @internal
     * @private
     * @param {string} msgId 
     * @param {string} method 
     * @param {Record<string, *>} params
     * @returns {void}
     */
    async _onSend(msgId, method, params) {
        // if (this._state !== OPEN) {
        //     // ignore messages received when not OPEN
        //     // TODO: do we need this?
        //     return;
        // }

        let handler = this._handlers.get(method);
        if (!handler) {
            handler = this._wildcardHandler;
        }

        if (!handler) {
            throw createRPCError("NotImplemented", `Unable to handle '${method}' sends`, {
                messageId: msgId,
                method,
                params,
            });
        }

        if (this._strictProtocols.includes(this._protocol)) {
            // perform some strict-mode checks
            const validator = this._strictValidators.get(this._protocol);
            try {
                validator.validate(validator.getBaseId(method), params);
            } catch (error) {
                this.emit('strictValidationFailure', {
                    messageId: msgId,
                    method,
                    params,
                    result: null,
                    error,
                    outbound: false,
                    isCall: true,
                });
                throw error;
            }
        }

        await handler({
            typeId: MSG_SEND,
            messageId: msgId,
            method,
            params,
        });
    }

    /**
     * @internal
     * @private
     * @param {string} msgId 
     * @param {string} method 
     * @param {Record<string, *>} params
     * @returns {MsgCallResult | null}
     */
    async _onCall(msgId, method, params) {
        let payload;

        if (this._state !== OPEN) {
            // We don't want to begin processing calls during CLOSING state, as the caller will never
            // be able to receive the response.
            // Likewise, we shouldn't get any calls during CONNECTING or CLOSING state.
            throw Error("CALL message received while client state not OPEN");
        }

        if (this._pendingResponses.has(msgId)) {
            throw createRPCError("RpcFrameworkError", `Already processing a message with message ID: ${msgId}`, {});
        }

        try {
            let handler = this._handlers.get(method);
            if (!handler) {
                handler = this._wildcardHandler;
            }

            if (!handler) {
                throw createRPCError("NotImplemented", `Unable to handle '${method}' calls`, {
                    messageId: msgId,
                    method,
                    params,
                });
            }

            if (this._strictProtocols.includes(this._protocol)) {
                // perform some strict-mode checks
                const validator = this._strictValidators.get(this._protocol);
                try {
                    validator.validate(validator.getRequestId(method), params);
                } catch (error) {
                    this.emit('strictValidationFailure', {
                        messageId: msgId,
                        method,
                        params,
                        result: null,
                        error,
                        outbound: false,
                        isCall: true,
                    });
                    throw error;
                }
            }

            const ac = new AbortController();
            const callPromise = new Promise(async (resolve, reject) => {
                function reply(val) {
                    if (val instanceof Error) {
                        reject(val);
                    } else {
                        resolve(val);
                    }
                }

                try {
                    reply(await handler({
                        typeId: MSG_CALL,
                        messageId: msgId,
                        method,
                        params,
                        signal: ac.signal,
                        reply,
                    }));
                } catch (err) {
                    reply(err);
                }
            });

            if (!([OPEN, CONNECTING].includes(this._state))) {
                // If the socket isn't open for business, inform the handler that it can abort
                // handling this call if it wants to.
                ac.abort();
                // Note: the handler is not forcibly aborted - it's just advisory, letting it know
                // that the response will never arive at the other end, potentially saving some time
                // from performing a pointless task.
            }
            
            const pending = {abort: ac.abort.bind(ac), promise: callPromise};
            this._pendingResponses.set(msgId, pending);
            const result = await callPromise;

            this.emit('callResult', {
                outbound: false,
                messageId: msgId,
                method,
                params,
                result,
            });

            if (result === NOREPLY) {
                return null; // don't send a reply
            }

            payload = [MSG_CALLRESULT, msgId, result];

            if (this._strictProtocols.includes(this._protocol)) {
                // perform some strict-mode checks
                const validator = this._strictValidators.get(this._protocol);
                try {
                    validator.validate(validator.getResponseId(method), result);
                } catch (error) {
                    this.emit('strictValidationFailure', {
                        messageId: msgId,
                        method,
                        params,
                        result,
                        error,
                        outbound: true,
                        isCall: false,
                    });
                    throw createRPCError("InternalError");
                }
            }

            return payload;

        } catch (err) {

            this.emit('callError', {
                outbound: false,
                messageId: msgId,
                method,
                params,
                error: err,
            });

            throw err;

        } finally {
            this._pendingResponses.delete(msgId);
        }
    }

    
    /**
     * @internal
     * @private
     * @param {string} msgId 
     * @param {Record<string, *>} result
     * @returns {void}
     */
    _onCallResult(msgId, result) {
        const pendingCall = this._pendingCalls.get(msgId);

        if (!pendingCall) {
            throw createRPCError("RpcFrameworkError", `Received CALLRESULT for unrecognised message ID: ${msgId}`, {
                msgId,
                result
            });
        }

        if (this._strictProtocols.includes(this._protocol)) {
            // perform some strict-mode checks
            const validator = this._strictValidators.get(this._protocol);
            try {
                validator.validate(validator.getResponseId(pendingCall.method), result);
            } catch (error) {
                this.emit('strictValidationFailure', {
                    messageId: msgId,
                    method: pendingCall.method,
                    params: pendingCall.params,
                    result,
                    error,
                    outbound: false,
                    isCall: false,
                });
                return pendingCall.reject(error);
            }
        }

        pendingCall.resolve(result);
    }

    /**
     * @internal
     * @private
     * @param {string} msgId 
     * @param {import('./util.js').RPCErrorCode} errorCode
     * @param {string} errorDescription
     * @param {Record<string, *>} errorDetails
     * @returns {void}
     */
    _onCallError(msgId, errorCode, errorDescription, errorDetails) {
        const pendingCall = this._pendingCalls.get(msgId);

        if (!pendingCall) {
            throw createRPCError("RpcFrameworkError", `Received CALLERROR for unrecognised message ID: ${msgId}`, {
                msgId,
                errorCode,
                errorDescription,
                errorDetails
            });
        }

        const err = createRPCError(errorCode, errorDescription, errorDetails);
        pendingCall.reject(err);
    }

    /** @internal @private */
    _onCallResultError(msgId, errorCode, errorDescription, errorDetails) {
        const err = createRPCError(errorCode, errorDescription, errorDetails);
        this.emit('callResultError', {
            messageId: msgId,
            outbound: false,
            error: err
        });
    }

    /**
     * Emits an 'error' event or logs to console if user hasn't subscribed to the 'error' event.
     * @internal
     * @private
     * @param {Error} err 
     */
    _logError(err) {
        if (this.listenerCount('error') > 0) {
            this.emit('error', err);
        } else {
            // user neglected to handle error event
            console.error('[Client Warning] Unhandled error:', err);
        }
    }
}

RPCClient.OPEN = OPEN;
RPCClient.CONNECTING = CONNECTING;
RPCClient.CLOSING = CLOSING;
RPCClient.CLOSED = CLOSED;
