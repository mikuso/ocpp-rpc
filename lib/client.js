import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { EventEmitter, once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { setTimeout as setTimeoutCb } from 'node:timers';
import WebSocket from 'ws';
import { ExponentialStrategy } from 'backoff';
const { CONNECTING, OPEN, CLOSING, CLOSED } = WebSocket;
import { NOREPLY } from './symbols.js';
import { TimeoutError, UnexpectedHttpResponse, RPCFrameworkError, RPCGenericError, RPCMessageTypeNotSupportedError } from './errors.js';
import { getErrorPlainObject, createRPCError, getPackageIdent } from './util.js';
import { Queue } from './queue.js';
import { EventBuffer } from './event-buffer.js';
import standardValidators from './standard-validators.js';
import { isValidStatusCode } from './ws-util.js';

const MSG_CALL = 2;
const MSG_CALLRESULT = 3;
const MSG_CALLERROR = 4;


/**
 * @typedef {object} RPCClientOptions
 * @prop {string} endpoint The RPC server's endpoint (a websocket URL). Required.
 * @prop {string} identity The RPC client's identity. Will be automatically percent-encoded when used in the connection URL. Required.
 * @prop {string[]} [protocols=[]] Array of subprotocols supported by this client.
 * @prop {string|Buffer} [password] Optional password to use in HTTP Basic auth. This can be a Buffer to allow for binary auth keys. If provided as a string, it will be encoded as UTF-8.
 * @prop {object} [headers={}] Additional HTTP headers to send along with the websocket upgrade request.
 * @prop {object|string} [query=''] An optional query string or object to append as the query string of the connection URL.
 * @prop {number} [callTimeoutMs=60000] Milliseconds to wait before unanswered outbound calls are rejected automatically.
 * @prop {number} [pingIntervalMs=30000] Milliseconds between WebSocket pings. Used for keep-alive timeouts.
 * @prop {boolean} [deferPingsOnActivity=false] Should the client skip sending keep-alive pings if activity received?
 * @prop {boolean|Array.<string>} [strictMode=false] Enable strict validation of calls & responses. Pass an array of subprotocol names to limit strict mode to specific protocols.
 * @prop {Array.<Validator>} [strictModeValidators=[]] Optional additional validators to be used in conjunction with strictMode.
 * @prop {boolean} [respondWithDetailedErrors=false] Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler.
 * @prop {number} [callConcurrency=1] The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no concurrency limit imposed on inbound calls.
 * @prop {boolean} [reconnect=true] If true, the client will attempt to reconnect after losing connection to the RPCServer. Only applies after making one initial successful connection.
 * @prop {number} [maxReconnects=Infinity] If reconnect is true, specifies the number of times to try reconnecting before failing and emitting a 'close' event.
 * @prop {object} [backoff] If reconnect is true, specifies the options for an ExponentialStrategy backoff strategy.
 * @prop {number} [backoff.initialDelay=1000] Initial delay in milliseconds before first reconnect attempt.
 * @prop {number} [backoff.maxDelay=10000] Maximum delay in milliseconds between reconnect attempts.
 * @prop {number} [backoff.factor=2] Factor by which the delay increases after each attempt.
 * @prop {number} [backoff.randomisationFactor=0.25] Randomisation factor to add jitter to reconnect delays.
 * @prop {number} [maxBadMessages=Infinity] The maximum number of non-conforming RPC messages which can be tolerated before the client is automatically closed.
 * @prop {object} [wsOpts={}] Additional WebSocket options.
 * @group Types
 */

/**
 * Represents the current state of a WebSocket connection.
 * The four possible values correspond to the WebSocket ready state constants:
 * - `0` (`RPCClient.CONNECTING`) - The connection is being established.
 * - `1` (`RPCClient.OPEN`) - The connection is open and ready to communicate.
 * - `2` (`RPCClient.CLOSING`) - The connection is in the process of closing.
 * - `3` (`RPCClient.CLOSED`) - The connection is closed or could not be opened.
 * @typedef {0 | 1 | 2 | 3} ConnectionState
 * @group Types
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
     * Emitted immediately before an outbound call is sent, or immediately before an inbound call
     * is processed. Useful for logging or debugging. To handle and respond to the call, use
     * client.handle() instead.
     * @event
     * @overload
     * @param {'call'} event
     * @param {(data: {messageId: string, outbound: boolean, payload: Array}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately after a call result is successfully sent or received.
     * @event
     * @overload
     * @param {'callResult'} event
     * @param {(data: {messageId: string, outbound: boolean, method: string, params: object, result: object}) => void} listener
     * @returns {this}
     */
    /**
     * Emitted immediately after a call error is sent or received, and also upon any call
     * rejection including timeouts, abort signals, and connection interruptions.
     * Will NOT be emitted if noReply option was used on the call.
     * @event
     * @overload
     * @param {'callError'} event
     * @param {(data: {messageId: string, outbound: boolean, method: string, params: object, error: RPCError|Error}) => void} listener
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
     * Emitted when the underlying WebSocket instance fires an 'error' event.
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
     * @param {(data: {buffer: Buffer, error: Error, response: Array|null}) => void} listener
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

        /** @internal */
        this._identity = undefined;
        /** @internal */
        this._wildcardHandler = null;
        /** @internal */
        this._handlers = new Map();

        /** @internal @type {ConnectionState} */
        this._state = CLOSED;
        
        /** @internal */
        this._callQueue = new Queue();
        
        /** @internal */
        this._ws = undefined;
        /** @internal */
        this._wsAbortController = undefined;
        /** @internal */
        this._keepAliveAbortController = undefined;
        /** @internal */
        this._pendingPingResponse = false;
        /** @internal */
        this._lastPingTime = 0;
        /** @internal */
        this._closePromise = undefined;
        /** @internal @type {string[]} */
        this._protocolOptions = [];
        /** @internal */
        this._protocol = undefined;
        /** @internal @type {string[]} */
        this._strictProtocols = [];
        /** @internal */
        this._strictValidators = undefined;

        /** @internal */
        this._pendingCalls = new Map();
        /** @internal */
        this._pendingResponses = new Map();
        /** @internal @type {Array.<string|Buffer>} */
        this._outboundMsgBuffer = [];
        /** @internal */
        this._connectedOnce = false;
        
        /** @internal */
        this._backoffStrategy = undefined;
        /** @internal */
        this._badMessagesCount = 0;
        /** @internal */
        this._reconnectAttempt = 0;
        /** @internal */
        this._connectionUrl = undefined;
        /** @internal */
        this._connectPromise = undefined;
        /** @internal */
        this._nextPingTimeout = undefined;

        /** @internal */
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
     * @param {RPCClientOptions} options
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

        this._callQueue.setConcurrency(newOpts.callConcurrency);
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
     *   code reported by the OS will typically be `1006` (Abnormal Closure).
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
     * When the handler function is invoked, it will be passed an object with the following properties:
     * - method {string}: The name of the method being invoked (useful for wildcard handlers).
     * - params {*}: The parameters of the call.
     * - signal {AbortSignal}: A signal which will abort if the underlying connection is dropped.
     *   You may choose whether to ignore the signal or not, but it can save time by aborting early.
     * - messageId {string}: The OCPP Message ID used in the call.
     * - reply {Function}: A callback to send a response to the call. Accepts a response value,
     *   an Error, or a Promise which resolves to either.
     *   - If a value (or a Promise resolving to a value) is passed, a CALLRESULT is sent.
     *   - If an Error (or a Promise rejecting with an Error) is passed, a CALLERROR is sent.
     *   - If the NOREPLY symbol is passed, no response is sent; you must then send a response
     *     manually (e.g. via sendRaw()).
     *   Calling reply() more than once, or returning/throwing after calling reply(), is a no-op.
     *   If the handler returns or throws before reply() is called, reply() is called implicitly
     *   with the returned value or thrown Error.
     *
     * @param {string} [method] - The name of the RPC method to handle. If not provided, acts as a "wildcard" handler.
     * @param {Function} handler - A function that can handle incoming calls for this method.
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
     * @param {*} params - A value to be passed as params to the remote handler.
     * @param {Object} [options] - Call options
     * @param {number} [options.callTimeoutMs] - Call timeout (in milliseconds). Defaults to the same value as the option passed to the client/server constructor.
     * @param {AbortSignal} [options.signal] - AbortSignal to cancel the call.
     * @param {boolean} [options.noReply=false] - Send call without expecting a response, resolving immediately with `undefined`. If a response is received, a `badMessage` event will be emitted instead. Note: `callError` is NOT emitted when using noReply.
     * @returns {Promise<*>} Response value from the remote handler.
     */
    async call(method, params, options = {}) {
        return await this._callQueue.push(this._call.bind(this, method, params, options));
    }

    /** @internal */
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
     * @param {WebSocket} ws - A WebSocket instance
     * @param {EventBuffer} leadMsgBuffer - A buffer which traps all 'message' events
     */
    _attachWebsocket(ws, leadMsgBuffer) {
        ws.once('close', (code, reason) => this._handleDisconnect({code, reason}));
        ws.on('error', err => this.emit('socketError', err));
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

        process.nextTick(() => {
            if (leadMsgBuffer) {
                const messages = leadMsgBuffer.condense();
                messages.forEach(([msg]) => this._onMessage(msg));
            }
            ws.on('message', msg => this._onMessage(msg));
        });
    }

    /** @internal */
    _rejectPendingCalls(abortReason) {
        const pendingCalls = Array.from(this._pendingCalls.values());
        const pendingResponses = Array.from(this._pendingResponses.values());
        [...pendingCalls, ...pendingResponses].forEach(c => c.abort(abortReason));
    }

    /** @internal */
    async _awaitUntilPendingSettled() {
        const pendingCalls = Array.from(this._pendingCalls.values());
        const pendingResponses = Array.from(this._pendingResponses.values());
        return await Promise.allSettled([
            ...pendingResponses.map(c => c.promise),
            ...pendingCalls.map(c => c.promise),
        ]);
    }

    /** @internal */
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

    /** @internal */
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
    
            const leadMsgBuffer = new EventBuffer(this._ws, 'message');
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
                    this.emit('protocol', this._protocol);
                }

                // limit protocol options in case of future reconnect
                this._protocolOptions = this._protocol ? [this._protocol] : [];

                this._reconnectAttempt = 0;
                this._backoffStrategy.reset();
                this._state = OPEN;
                this._connectedOnce = true;
                this._pendingPingResponse = false;
                
                this._attachWebsocket(this._ws, leadMsgBuffer);

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

    /** @internal */
    _deferNextPing() {
        if (!this._nextPingTimeout) {
            return;
        }

        this._nextPingTimeout.refresh();
    }

    /** @internal */
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

    /** @internal */
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

                    const intolerableErrors = [
                        'Maximum redirects exceeded',
                        'Server sent no subprotocol',
                        'Server sent an invalid subprotocol',
                        'Server sent a subprotocol but none was requested',
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

    /** @internal */
    _onMessage(buffer) {
        if (this._options.deferPingsOnActivity) {
            this._deferNextPing();
        }

        const message = buffer.toString('utf8');

        if (!message.length) {
            // ignore empty messages
            // for compatibility with some particular charge point vendors (naming no names)
            return;
        }

        this.emit('message', {message, outbound: false});

        let msgId = '-1';
        let messageType;
        
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

            // Extension fallback mechanism
            // (see section 4.4 of OCPP2.0.1J)
            if (![MSG_CALL, MSG_CALLERROR, MSG_CALLRESULT].includes(messageTypePart)) {
                throw createRPCError("MessageTypeNotSupported", "Unrecognised message type", {});
            }

            messageType = messageTypePart;

            if (typeof msgIdPart !== 'string') {
                throw createRPCError("RpcFrameworkError", "Message ID must be a string", {});
            }
            
            msgId = msgIdPart;
            
            switch (messageType) {
                case MSG_CALL:
                    const [method, params] = more;
                    if (typeof method !== 'string') {
                        throw new RPCFrameworkError("Method must be a string");
                    }
                    this.emit('call', {outbound: false, payload});
                    this._onCall(msgId, method, params);
                    break;
                case MSG_CALLRESULT:
                    const [result] = more;
                    this.emit('response', {outbound: false, payload});
                    this._onCallResult(msgId, result);
                    break;
                case MSG_CALLERROR:
                    const [errorCode, errorDescription, errorDetails] = more;
                    this.emit('response', {outbound: false, payload});
                    this._onCallError(msgId, errorCode, errorDescription, errorDetails);
                    break;
                default:
                    throw new RPCMessageTypeNotSupportedError(`Unexpected message type: ${messageType}`);
            }

            this._badMessagesCount = 0;

        } catch (error) {
            
            const shouldClose = ++this._badMessagesCount > this._options.maxBadMessages;

            let response = null;
            let errorMessage = '';

            if (![MSG_CALLERROR, MSG_CALLRESULT].includes(messageType)) {
                // We shouldn't respond to CALLERROR or CALLRESULT, but we may respond
                // to any CALL (or other unknown message type) with a CALLERROR
                // (see section 4.4 of OCPP2.0.1J - Extension fallback mechanism)
                const details = error.details
                    || (this._options.respondWithDetailedErrors ? getErrorPlainObject(error) : {});
                    
                errorMessage = error.message || error.rpcErrorMessage || "";

                response = [
                    MSG_CALLERROR,
                    msgId,
                    error.rpcErrorCode || 'GenericError',
                    errorMessage,
                    details ?? {},
                ];
            }
            
            this.emit('badMessage', {buffer, error, response});

            if (shouldClose) {
                this.close({
                    code: 1002,
                    reason: (error instanceof RPCGenericError) ? errorMessage : "Protocol error"
                });
            } else if (response && this._state === OPEN) {
                this.sendRaw(JSON.stringify(response));
            }
        }
    }

    /** @internal */
    async _onCall(msgId, method, params) {
        // NOTE: This method must not throw or else it risks sending 2 replies

        try {
            let payload;

            if (this._state !== OPEN) {
                throw Error("Call received while client state not OPEN");
            }

            try {
                if (this._pendingResponses.has(msgId)) {
                    throw createRPCError("RpcFrameworkError", `Already processing a call with message ID: ${msgId}`, {});
                }

                let handler = this._handlers.get(method);
                if (!handler) {
                    handler = this._wildcardHandler;
                }

                if (!handler) {
                    throw createRPCError("NotImplemented", `Unable to handle '${method}' calls`, {});
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
                    return; // don't send a reply
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

            } catch (err) {
                // catch here to prevent this error from being considered a 'badMessage'.

                const details = err.details
                    || (this._options.respondWithDetailedErrors ? getErrorPlainObject(err) : {});

                let rpcErrorCode = err.rpcErrorCode || 'GenericError';

                if (this.protocol === 'ocpp1.6') {
                    // Workaround for some mistakes in the spec in OCPP1.6J
                    // (clarified in section 5 of OCPP1.6J errata v1.0)
                    switch (rpcErrorCode) {
                        case 'FormatViolation':
                            rpcErrorCode = 'FormationViolation';
                            break;
                        case 'OccurenceConstraintViolation':
                            rpcErrorCode = 'OccurrenceConstraintViolation';
                            break;
                    }
                }

                payload = [
                    MSG_CALLERROR,
                    msgId,
                    rpcErrorCode,
                    err.message || err.rpcErrorMessage || "",
                    details ?? {},
                ];

                this.emit('callError', {
                    outbound: false,
                    messageId: msgId,
                    method,
                    params,
                    error: err,
                });

            } finally {
                this._pendingResponses.delete(msgId);
            }

            this.emit('response', {outbound: true, payload});
            this.sendRaw(JSON.stringify(payload));

        } catch (err) {
            this.close({code: 1000, reason: "Unable to send call result"});
        }
    }

    /** @internal */
    _onCallResult(msgId, result) {
        const pendingCall = this._pendingCalls.get(msgId);
        if (pendingCall) {

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

            return pendingCall.resolve(result);

        } else {
            throw createRPCError("RpcFrameworkError", `Received CALLRESULT for unrecognised message ID: ${msgId}`, {
                msgId,
                result
            });
        }
    }

    /** @internal */
    _onCallError(msgId, errorCode, errorDescription, errorDetails) {
        const pendingCall = this._pendingCalls.get(msgId);
        if (pendingCall) {
            const err = createRPCError(errorCode, errorDescription, errorDetails);
            pendingCall.reject(err);
        } else {
            throw createRPCError("RpcFrameworkError", `Received CALLERROR for unrecognised message ID: ${msgId}`, {
                msgId,
                errorCode,
                errorDescription,
                errorDetails
            });
        }
    }
}

RPCClient.OPEN = OPEN;
RPCClient.CONNECTING = CONNECTING;
RPCClient.CLOSING = CLOSING;
RPCClient.CLOSED = CLOSED;
