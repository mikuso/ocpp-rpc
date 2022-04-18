const {randomUUID} = require('crypto');
const {EventEmitter, once} = require('events');
const { setTimeout } = require('timers/promises');
const WebSocket = require('ws');
const { ExponentialStrategy } = require('backoff');
const {CONNECTING, OPEN, CLOSING, CLOSED} = WebSocket;
const { TimeoutError, MalformedMessageError, UnexpectedHttpResponse, RPCNotImplementedError } = require('./errors');
const { getErrorPlainObject, createRPCError } = require('./util');
const Queue = require('./queue');
const EventBuffer = require('./event-buffer');

const MSG_CALL = 2;
const MSG_CALLRESULT = 3;
const MSG_CALLERROR = 4;

class RPCClient extends EventEmitter {
    constructor(options) {
        super();

        this._options = Object.assign({
            // defaults
            wsOptions: {},
            callTimeoutMs: Infinity,
            pingIntervalMs: 1000*30,
            url: 'ws://localhost',
            protocols: [],
            reconnect: false,
            maxReconnects: Infinity,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
            backoff: {
                initialDelay: 1000,
                maxDelay: 10*1000,
                factor: 2,
                randomisationFactor: 0.25,
            }
        }, options || {});

        this._id = randomUUID();
        this._wildcardHandler = null;
        this._handlers = new Map();
        this._state = CLOSED;
        
        this._ws = undefined;
        this._wsAbortController = undefined;
        this._closePromise = undefined;
        this._protocolOptions = [];
        this._protocol = undefined;

        this._pendingCalls = new Map();
        this._pendingResponses = new Set();
        this._outboundMsgBuffer = [];
        this._connectedOnce = false;
        this._callQueue = new Queue({maxConcurrency: this._options.callConcurrency});

        this._reconnectAttempt = 0;
        this._backoffStrategy = new ExponentialStrategy(this._options.backoff);
    }

    get id() {
        return this._id;
    }

    get state() {
        return this._state;
    }

    get protocol() {
        return this._protocol;
    }

    /**
     * Attempt to connect to the RPCServer.
     * @returns {Promise<undefined>} Resolves when connected, rejects on failure
     */
    async connect() {
        this._protocolOptions = this._options.protocols ?? [];
        this._protocol = undefined;

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
            this.emit('close');
            throw err;
        }
    }

    /**
     * Send a message to the RPCServer. While socket is connecting, the message is queued and send when open.
     * @param {string} message - String to send via websocket
     */
    sendRaw(message) {
        if ([OPEN, CLOSING].includes(this._state) && this._ws) {
            // can send while closing so long as websocket doesn't mind
            this._ws.send(message);
        } else if (this._state === CONNECTING) {
            this._outboundMsgBuffer.push(message);
        } else {
            throw Error(`Cannot send message in this state`);
        }
    }

    /**
     * Closes the RPCClient.
     * @param {Object} options - Close options
     * @param {number} options.code - The websocket CloseEvent code.
     * @param {string} options.reason - The websocket CloseEvent reason.
     * @param {boolean} options.awaitPending - Wait for in-flight calls & responses to complete before closing.
     * @param {boolean} options.force - Terminate websocket immediately without passing code, reason, or waiting.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code CloseEvent codes}
     * @returns Promise<Object> - The CloseEvent (code & reason) for closure. May be different from requested code & reason.
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
                    this._ws.close(code ?? 1000, reason);
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
     * 
     * @param {string} [method] - The name of the RPC method to handle.
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
     * Call a method on a remote RPCClient or RPCServerClient.
     * @param {string} method - The RPC method to call.
     * @param {*} params - A value to be passed as params to the remote handler.
     * @param {Object} options - Call options
     * @param {number} options.callTimeoutMs - Call timeout (in milliseconds)
     * @param {AbortSignal} options.signal - AbortSignal to cancel the call.
     * @returns Promise<*> - Response value from the remote handler.
     */
    async call(method, params, options = {}) {
        return await this._callQueue.push(this._call.bind(this, method, params, options));
    }

    async _call(method, params, options = {}) {
        const timeoutMs = options.callTimeoutMs ?? this._options.callTimeoutMs;

        if ([CLOSED, CLOSING].includes(this._state)) {
            throw Error(`Cannot make call while socket not open`);
        }

        const msgId = randomUUID();
        const payload = [MSG_CALL, msgId, method, params];

        const pendingCall = {msgId, method, params};
        const timeoutAc = new AbortController();

        const cleanup = () => {
            if (pendingCall.timeout) {
                timeoutAc.abort();
            }
            this._pendingCalls.delete(msgId);
        };
        
        pendingCall.abort = (reason) => {
            pendingCall.reject(new DOMException(reason, "AbortError"));
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

        this.sendRaw(JSON.stringify(payload));

        return await pendingCall.promise;
    }

    /**
     * Start consuming from a WebSocket
     * @param {WebSocket} ws - A WebSocket instance
     * @param {EventBuffer} leadMsgBuffer - A buffer which traps all 'message' events
     */
    _attachWebsocket(ws, leadMsgBuffer) {
        ws.once('close', (code, reason) => this._handleDisconnect({code, reason}));
        ws.on('error', err => this.emit('socketError', err));
        process.nextTick(() => {
            const messages = leadMsgBuffer.condense();
            ws.on('message', msg => this._onMessage(msg));
            messages.forEach(([msg]) => this._onMessage(msg));
        });
    }

    _rejectPendingCalls(abortReason) {
        const pendingCalls = Array.from(this._pendingCalls.values());
        const pendingResponses = Array.from(this._pendingResponses.values());
        [...pendingCalls, ...pendingResponses].forEach(c => c.abort(abortReason));
    }

    async _awaitUntilPendingSettled() {
        const pendingCalls = Array.from(this._pendingCalls.values());
        const pendingResponses = Array.from(this._pendingResponses.values());
        return await Promise.allSettled([
            ...pendingResponses.map(c => c.promise),
            ...pendingCalls.map(c => c.promise),
        ]);
    }

    _handleDisconnect({code, reason}) {
        if (reason instanceof Buffer) {
            reason = reason.toString('utf8');
        }

        // reject any outstanding calls/responses
        this._rejectPendingCalls("Client disconnected");

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

    _beginConnect() {
        this._connectPromise = (async () => {

            this._wsAbortController = new AbortController();
            this._ws = new WebSocket(
                this._options.url,
                this._protocolOptions,
                {
                    noDelay: true,
                    signal: this._wsAbortController.signal,
                }
            );
    
            const leadMsgBuffer = new EventBuffer(this._ws, 'message');
            let serverResponse;

            try {
                await new Promise((resolve, reject) => {
                    this._ws.once('unexpected-response', (request, response) => {
                        const err = new UnexpectedHttpResponse();
                        err.request = request;
                        err.response = response;
                        reject(err);
                    });
                    this._ws.once('upgrade', (response) => {
                        serverResponse = response;
                    });
                    this._ws.once('error', err => reject(err));
                    this._ws.once('open', () => resolve());
                });

                // record which protocol was selected
                if (this._protocol === undefined) {
                    this._protocol = this._ws.protocol;
                    this.emit('protocol', {protocol: this._protocol});
                }

                // limit protocol options in case of future reconnect
                this._protocolOptions = this._protocol ? [this._protocol] : [];

                this._reconnectAttempt = 0;
                this._backoffStrategy.reset();
                this._state = OPEN;
                this._connectedOnce = true;
                
                this._attachWebsocket(this._ws, leadMsgBuffer);

                // send queued messages
                if (this._outboundMsgBuffer.length > 0) {
                    const buff = this._outboundMsgBuffer;
                    this._outboundMsgBuffer = [];
                    buff.forEach(msg => this.sendRaw(msg));
                }

                this.emit('open', {
                    response: serverResponse
                });
                
            } catch (err) {

                this._ws.terminate();
                err.serverResponse = serverResponse;
                throw err;
            }
            
        })();

        this._state = CONNECTING;
        this.emit('connecting', {protocolOptions: this._protocolOptions});

        return this._connectPromise;
    }

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

    _onMessage(buffer) {
        try {
            const msg = buffer.toString('utf8');

            this.emit('message', msg);

            let msgArray;
            try {
                msgArray = JSON.parse(msg);
            } catch (err) {
                throw new MalformedMessageError("Message must be a JSON structure");
            }

            if (!Array.isArray(msgArray)) {
                throw new MalformedMessageError("Message must be an array");
            }

            const [messageType, msgId, ...more] = msgArray;
            if (typeof msgId !== 'string') {
                throw new MalformedMessageError("Message ID must be a string");
            }
            
            switch (messageType) {
                case MSG_CALL:
                    const [method, params] = more;
                    if (typeof method !== 'string') {
                        throw new MalformedMessageError("Method must be a string");
                    }
                    this._onCall(msgId, method, params);
                    break;
                case MSG_CALLRESULT:
                    const [result] = more;
                    this._onCallResult(msgId, result);
                    break;
                case MSG_CALLERROR:
                    const [errorCode, errorDescription, errorDetails] = more;
                    this._onCallError(msgId, errorCode, errorDescription, errorDetails);
                    break;
                default:
                    throw new MalformedMessageError(`Unexpected message type: ${messageType}`);
                    break;
            }

        } catch (err) {
            this.close({
                code: 1002,
                reason: (err instanceof MalformedMessageError) ? err.message : "Protocol error"
            });
        }
    }

    async _onCall(msgId, method, params) {
        try {
            if (this._state !== OPEN) {
                throw Error("Call received after state no longer OPEN");
            }

            let payload;
            try {
                let handler = this._handlers.get(method);
                if (!handler) {
                    handler = this._wildcardHandler;
                }
                if (!handler) {
                    throw new RPCNotImplementedError();
                }

                const ac = new AbortController();
                const callPromise = Promise.resolve(handler({method, params, signal: ac.signal}));
                const pending = {abort: ac.abort.bind(ac), promise: callPromise};
                this._pendingResponses.add(pending);
                const result = await callPromise;
                this._pendingResponses.delete(pending);
                payload = [MSG_CALLRESULT, msgId, result];

            } catch (err) {
                const details = err.details
                    || (this._options.respondWithDetailedErrors ? getErrorPlainObject(err) : {});

                payload = [
                    MSG_CALLERROR,
                    msgId,
                    err.rpcErrorCode || 'GenericError',
                    err.message || err.rpcErrorMessage || "",
                    details ?? {},
                ];
            }

            this.sendRaw(JSON.stringify(payload));
        } catch (err) {
            this.close({code: 1000, reason: "Unable to send call result"});
        }
    }

    _onCallResult(msgId, result) {
        const pendingCall = this._pendingCalls.get(msgId);
        if (pendingCall) {
            pendingCall.resolve(result);
        } else {
            this.emit('unexpectedMessage', {
                messageType: MSG_CALLRESULT,
                msgId,
                result
            });
        }
    }

    _onCallError(msgId, errorCode, errorDescription, errorDetails) {
        const pendingCall = this._pendingCalls.get(msgId);
        if (pendingCall) {
            const err = createRPCError(errorCode, errorDescription, errorDetails);
            pendingCall.reject(err);
        } else {
            this.emit('unexpectedMessage', {
                messageType: MSG_CALLERROR,
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

module.exports = RPCClient;