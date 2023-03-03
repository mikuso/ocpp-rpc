import { randomUUID } from 'node:crypto';
import { EventEmitter, once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { setTimeout as setTimeoutCb } from 'node:timers';
import { WebSocket } from 'ws';
import { NOREPLY } from './symbols';
import { TimeoutError, RPCFrameworkError, RPCGenericError, RPCMessageTypeNotSupportedError } from './errors';
import { getErrorPlainObject, createRPCError } from './util';
import Queue from './queue';
import standardValidators from './standard-validators';
import { isValidStatusCode } from './ws-util';
var MsgType;
(function (MsgType) {
    MsgType[MsgType["UNKNOWN"] = -1] = "UNKNOWN";
    MsgType[MsgType["CALL"] = 2] = "CALL";
    MsgType[MsgType["RESULT"] = 3] = "RESULT";
    MsgType[MsgType["ERROR"] = 4] = "ERROR";
})(MsgType || (MsgType = {}));
export var StateEnum;
(function (StateEnum) {
    StateEnum[StateEnum["CONNECTING"] = WebSocket.CONNECTING] = "CONNECTING";
    StateEnum[StateEnum["OPEN"] = WebSocket.OPEN] = "OPEN";
    StateEnum[StateEnum["CLOSING"] = WebSocket.CLOSING] = "CLOSING";
    StateEnum[StateEnum["CLOSED"] = WebSocket.CLOSED] = "CLOSED";
})(StateEnum || (StateEnum = {}));
export class RPCBaseClient extends EventEmitter {
    _identity;
    _wildcardHandler;
    _handlers;
    _state;
    _callQueue;
    _ws;
    _wsAbortController;
    _keepAliveAbortController;
    _pendingPingResponse;
    _lastPingTime;
    _closePromise;
    _protocolOptions;
    _protocol;
    _strictProtocols;
    _strictValidators;
    _pendingCalls;
    _pendingResponses;
    _outboundMsgBuffer;
    _connectedOnce;
    _badMessagesCount;
    _reconnectAttempt;
    _options;
    _connectionUrl;
    _connectPromise;
    _nextPingTimeout;
    constructor(options) {
        super();
        this._identity = options.identity;
        this._wildcardHandler = undefined;
        this._handlers = new Map();
        this._state = StateEnum.CLOSED;
        this._callQueue = new Queue();
        this._connectionUrl = new URL('');
        this._ws = undefined;
        this._wsAbortController = undefined;
        this._keepAliveAbortController = undefined;
        this._pendingPingResponse = false;
        this._lastPingTime = 0;
        this._closePromise = undefined;
        this._protocolOptions = [];
        this._protocol = undefined;
        this._strictProtocols = [];
        this._strictValidators = new Map();
        this._pendingCalls = new Map();
        this._pendingResponses = new Map();
        this._outboundMsgBuffer = [];
        this._connectedOnce = false;
        this._badMessagesCount = 0;
        this._reconnectAttempt = 0;
        this._options = {
            // defaults
            identity: '',
            endpoint: 'ws://localhost',
            password: undefined,
            callTimeoutMs: 1000 * 60,
            pingIntervalMs: 1000 * 30,
            deferPingsOnActivity: false,
            headers: {},
            protocols: [],
            reconnect: true,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
            maxBadMessages: Infinity,
            strictMode: false,
            strictModeValidators: [],
        };
        this.reconfigure(options || {});
    }
    get identity() {
        return this._identity;
    }
    get protocol() {
        return this._protocol;
    }
    get state() {
        return this._state;
    }
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
        }
        else if (newOpts.strictMode) {
            this._strictProtocols = newOpts.protocols;
        }
        const missingValidator = this._strictProtocols.find(protocol => !this._strictValidators.has(protocol));
        if (missingValidator) {
            throw Error(`Missing strictMode validator for subprotocol '${missingValidator}'`);
        }
        this._callQueue.setConcurrency(newOpts.callConcurrency);
        if ('pingIntervalMs' in options) {
            this._keepAlive();
        }
    }
    /**
     * Send a message to the RPCServer. While socket is connecting, the message is queued and send when open.
     * @param {Buffer|String} message - String to send via websocket
     */
    sendRaw(message) {
        if ([StateEnum.OPEN, StateEnum.CLOSING].includes(this._state) && this._ws) {
            // can send while closing so long as websocket doesn't mind
            this._ws.send(message);
            this.emit('message', { message, outbound: true });
        }
        else if (this._state === StateEnum.CONNECTING) {
            this._outboundMsgBuffer.push(message);
        }
        else {
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
    async close({ code, reason, awaitPending, force } = {}) {
        const defaultCloseEvent = { code: 1000, reason: '' };
        if ([StateEnum.CLOSED, StateEnum.CLOSING].includes(this._state)) {
            // no-op
            return this._closePromise ?? defaultCloseEvent;
        }
        if (this._state === StateEnum.OPEN) {
            this._closePromise = (async () => {
                if (!this._ws) {
                    return defaultCloseEvent;
                }
                if (force || !awaitPending) {
                    // reject pending calls
                    this._rejectPendingCalls("Client going away");
                }
                if (force) {
                    this._ws.terminate();
                }
                else {
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
                return { code: codeRes, reason: reasonRes };
            })();
            this._state = StateEnum.CLOSING;
            this._connectedOnce = false;
            this.emit('closing');
            return this._closePromise;
        }
        else if (this._wsAbortController) {
            const result = this._connectedOnce ?
                { code, reason } :
                { code: 1001, reason: "Connection aborted" };
            this._wsAbortController.abort();
            this._state = StateEnum.CLOSED;
            this._connectedOnce = false;
            this.emit('close', result);
            return result;
        }
        return defaultCloseEvent;
    }
    handle(methodOrHandler, handler) {
        if (typeof methodOrHandler === 'string' && handler instanceof Function) {
            this._handlers.set(methodOrHandler, handler);
        }
        else if (methodOrHandler instanceof Function) {
            this._wildcardHandler = methodOrHandler;
        }
    }
    /**
     *
     * @param {string} [method] - The name of the handled method.
     */
    removeHandler(method) {
        if (method == null) {
            this._wildcardHandler = undefined;
        }
        else {
            this._handlers.delete(method);
        }
    }
    removeAllHandlers() {
        this._wildcardHandler = undefined;
        this._handlers.clear();
    }
    /**
     * Call a method on a remote RPCClient or RPCServerClient.
     * @param {string} method - The RPC method to call.
     * @param {*} params - A value to be passed as params to the remote handler.
     * @param {Object} options - Call options
     * @param {number} options.callTimeoutMs - Call timeout (in milliseconds)
     * @param {AbortSignal} options.signal - AbortSignal to cancel the call.
     * @param {boolean} options.noReply - If set to true, the call will return immediately.
     * @returns Promise<*> - Response value from the remote handler.
     */
    async call(method, params, options = {}) {
        return await this._callQueue.push(this._call.bind(this, method, params, options));
    }
    async _call(method, params, options = {}) {
        const timeoutMs = options.callTimeoutMs ?? this._options.callTimeoutMs;
        if ([StateEnum.CLOSED, StateEnum.CLOSING].includes(this._state)) {
            throw Error(`Cannot make call while socket not open`);
        }
        const msgId = randomUUID();
        const payload = [MsgType.CALL, msgId, method, params];
        if (typeof this._protocol === 'string' && this._strictProtocols.includes(this._protocol)) {
            // perform some strict-mode checks
            const validator = this._strictValidators.get(this._protocol);
            try {
                validator.validate(`urn:${method}.req`, params);
            }
            catch (error) {
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
        const pendingCall = { msgId, method, params };
        if (!options.noReply) {
            const timeoutAc = new AbortController();
            const cleanup = () => {
                if (pendingCall.timeout) {
                    timeoutAc.abort();
                }
                this._pendingCalls.delete(msgId);
            };
            pendingCall.abort = (reason) => {
                const err = Error(reason ?? "Call Aborted");
                err.name = "AbortError";
                pendingCall.reject?.(err);
            };
            if (options.signal) {
                once(options.signal, 'abort').then(() => {
                    pendingCall.abort?.(options.signal?.reason);
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
                pendingCall.timeout = setTimeout(timeoutMs, null, { signal: timeoutAc.signal }).then(() => {
                    pendingCall.reject?.(timeoutError);
                }).catch(err => { });
            }
            this._pendingCalls.set(msgId, pendingCall);
        }
        this.emit('call', { outbound: true, payload });
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
        }
        catch (err) {
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
     * @param {WebSocket} ws - A WebSocket instance
     * @param {EventBuffer} leadMsgBuffer - A buffer which traps all 'message' events
     */
    _attachWebsocket(ws, leadMsgBuffer) {
        ws.once('close', (code, reason) => this._handleDisconnect({ code, reason }));
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
            this.emit('ping', { rtt });
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
    _handleDisconnect({ code, reason }) {
        if (reason instanceof Buffer) {
            reason = reason.toString('utf8');
        }
        // reject any outstanding calls/responses
        this._rejectPendingCalls("Client disconnected");
        this._keepAliveAbortController?.abort();
        this.emit('disconnect', { code, reason });
        if (this._state === StateEnum.CLOSED) {
            // nothing to do here
            return;
        }
        this._state = StateEnum.CLOSED;
        this.emit('close', { code, reason });
    }
    _deferNextPing() {
        if (!this._nextPingTimeout) {
            return;
        }
        this._nextPingTimeout.refresh();
    }
    async _keepAlive() {
        // abort any previously running keepAlive
        this._keepAliveAbortController?.abort();
        const timerEmitter = new EventEmitter();
        const nextPingTimeout = setTimeoutCb(() => {
            timerEmitter.emit('next');
        }, this._options.pingIntervalMs);
        this._nextPingTimeout = nextPingTimeout;
        try {
            if (this._state !== StateEnum.OPEN) {
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
                await once(timerEmitter, 'next', { signal: this._keepAliveAbortController.signal }),
                    this._keepAliveAbortController.signal.throwIfAborted();
                if (this._state !== StateEnum.OPEN) {
                    // keepalive no longer required
                    break;
                }
                if (this._pendingPingResponse) {
                    // we didn't get a response to our last ping
                    throw Error("Ping timeout");
                }
                this._lastPingTime = Date.now();
                this._pendingPingResponse = true;
                this._ws?.ping();
                nextPingTimeout.refresh();
            }
        }
        catch (err) {
            // console.log('keepalive failed', err);
            if (err.name !== 'AbortError') {
                // throws on ws.ping() error
                this._ws?.terminate();
            }
        }
        finally {
            clearTimeout(nextPingTimeout);
        }
    }
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
        this.emit('message', { message, outbound: false });
        let msgId = '-1';
        let messageType = MsgType.UNKNOWN;
        try {
            let payload;
            try {
                payload = JSON.parse(message);
            }
            catch (err) {
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
            if (![MsgType.CALL, MsgType.ERROR, MsgType.RESULT].includes(messageTypePart)) {
                throw createRPCError("MessageTypeNotSupported", "Unrecognised message type", {});
            }
            messageType = messageTypePart;
            if (typeof msgIdPart !== 'string') {
                throw createRPCError("RpcFrameworkError", "Message ID must be a string", {});
            }
            msgId = msgIdPart;
            switch (messageType) {
                case MsgType.CALL:
                    const [method, params] = more;
                    if (typeof method !== 'string') {
                        throw new RPCFrameworkError("Method must be a string");
                    }
                    this.emit('call', { outbound: false, payload });
                    this._onCall(msgId, method, params);
                    break;
                case MsgType.RESULT:
                    const [result] = more;
                    this.emit('response', { outbound: false, payload });
                    this._onCallResult(msgId, result);
                    break;
                case MsgType.ERROR:
                    const [errorCode, errorDescription, errorDetails] = more;
                    this.emit('response', { outbound: false, payload });
                    this._onCallError(msgId, errorCode, errorDescription, errorDetails);
                    break;
                default:
                    throw new RPCMessageTypeNotSupportedError(`Unexpected message type: ${messageType}`);
            }
            this._badMessagesCount = 0;
        }
        catch (error) {
            const shouldClose = ++this._badMessagesCount > this._options.maxBadMessages;
            let response = null;
            let errorMessage = '';
            if (![MsgType.ERROR, MsgType.RESULT].includes(messageType)) {
                // We shouldn't respond to CALLERROR or CALLRESULT, but we may respond
                // to any CALL (or other unknown message type) with a CALLERROR
                // (see section 4.4 of OCPP2.0.1J - Extension fallback mechanism)
                const details = error?.details
                    || (this._options.respondWithDetailedErrors ? getErrorPlainObject(error) : {});
                errorMessage = error.message || error.rpcErrorMessage || "";
                response = [
                    MsgType.ERROR,
                    msgId,
                    error?.rpcErrorCode || 'GenericError',
                    errorMessage,
                    details ?? {},
                ];
            }
            this.emit('badMessage', { buffer, error, response });
            if (shouldClose) {
                this.close({
                    code: 1002,
                    reason: (error instanceof RPCGenericError) ? errorMessage : "Protocol error"
                });
            }
            else if (response && this._state === StateEnum.OPEN) {
                this.sendRaw(JSON.stringify(response));
            }
        }
    }
    async _onCall(msgId, method, params) {
        // NOTE: This method must not throw or else it risks sending 2 replies
        try {
            let payload;
            if (this._state !== StateEnum.OPEN) {
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
                if (this._protocol && this._strictProtocols.includes(this._protocol)) {
                    // perform some strict-mode checks
                    const validator = this._strictValidators.get(this._protocol);
                    try {
                        validator.validate(`urn:${method}.req`, params);
                    }
                    catch (error) {
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
                        }
                        else {
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
                    }
                    catch (err) {
                        reply(err);
                    }
                });
                const pending = { abort: ac.abort.bind(ac), promise: callPromise };
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
                payload = [MsgType.RESULT, msgId, result];
                if (this._protocol && this._strictProtocols.includes(this._protocol)) {
                    // perform some strict-mode checks
                    const validator = this._strictValidators.get(this._protocol);
                    try {
                        validator.validate(`urn:${method}.conf`, result);
                    }
                    catch (error) {
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
            }
            catch (err) {
                // catch here to prevent this error from being considered a 'badMessage'.
                const details = err?.details
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
                    MsgType.ERROR,
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
            }
            finally {
                this._pendingResponses.delete(msgId);
            }
            this.emit('response', { outbound: true, payload });
            this.sendRaw(JSON.stringify(payload));
        }
        catch (err) {
            this.close({ code: 1000, reason: "Unable to send call result" });
        }
    }
    _onCallResult(msgId, result) {
        const pendingCall = this._pendingCalls.get(msgId);
        if (pendingCall) {
            if (this._protocol && this._strictProtocols.includes(this._protocol)) {
                // perform some strict-mode checks
                const validator = this._strictValidators.get(this._protocol);
                try {
                    validator.validate(`urn:${pendingCall.method}.conf`, result);
                }
                catch (error) {
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
        }
        else {
            throw createRPCError("RpcFrameworkError", `Received CALLRESULT for unrecognised message ID: ${msgId}`, {
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
        }
        else {
            throw createRPCError("RpcFrameworkError", `Received CALLERROR for unrecognised message ID: ${msgId}`, {
                msgId,
                errorCode,
                errorDescription,
                errorDetails
            });
        }
    }
}
