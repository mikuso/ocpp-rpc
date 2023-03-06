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
export var MsgType;
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
    constructor(options) {
        super();
        this._identity = options.identity;
        this._wildcardHandler = undefined;
        this._handlers = new Map();
        this._state = StateEnum.CLOSED;
        this._callQueue = new Queue();
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
        var _a;
        const newOpts = Object.assign(this._options, options);
        if (!newOpts.identity) {
            throw Error(`'identity' is required`);
        }
        if (newOpts.strictMode && !((_a = newOpts.protocols) === null || _a === void 0 ? void 0 : _a.length)) {
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
            if (!newOpts.protocols) {
                throw Error(`To use strictMode, you must specify at least one subprotocol in options.protocols or pass a list of protocols to options.strictMode`);
            }
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
    sendRaw(message) {
        if ([StateEnum.OPEN, StateEnum.CLOSING].includes(this._state) && this._ws) {
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
    async close({ code, reason, awaitPending, force } = {}) {
        var _a;
        const defaultCloseEvent = { code: 1000, reason: '' };
        if ([StateEnum.CLOSED, StateEnum.CLOSING].includes(this._state)) {
            return (_a = this._closePromise) !== null && _a !== void 0 ? _a : defaultCloseEvent;
        }
        if (this._state === StateEnum.OPEN) {
            this._closePromise = (async () => {
                if (!this._ws) {
                    return defaultCloseEvent;
                }
                if (force || !awaitPending) {
                    this._rejectPendingCalls("Client going away");
                }
                if (force) {
                    this._ws.terminate();
                }
                else {
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
    async call(method, params = {}, options = {}) {
        return await this._callQueue.push(this._call.bind(this, method, params, options));
    }
    async _call(method, params, options = {}) {
        var _a;
        const timeoutMs = (_a = options.callTimeoutMs) !== null && _a !== void 0 ? _a : this._options.callTimeoutMs;
        if ([StateEnum.CLOSED, StateEnum.CLOSING].includes(this._state)) {
            throw Error(`Cannot make call while socket not open`);
        }
        const msgId = randomUUID();
        const payload = [MsgType.CALL, msgId, method, params];
        if (typeof this._protocol === 'string' && this._strictProtocols.includes(this._protocol)) {
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
        const pendingCall = {
            msgId,
            method,
            params
        };
        if (!options.noReply) {
            const timeoutAc = new AbortController();
            const cleanup = () => {
                if (pendingCall.timeout) {
                    timeoutAc.abort();
                }
                this._pendingCalls.delete(msgId);
            };
            pendingCall.abort = (reason) => {
                var _a;
                const err = Error(reason !== null && reason !== void 0 ? reason : "Call Aborted");
                err.name = "AbortError";
                (_a = pendingCall.reject) === null || _a === void 0 ? void 0 : _a.call(pendingCall, err);
            };
            if (options.signal) {
                once(options.signal, 'abort').then(() => {
                    var _a, _b;
                    (_a = pendingCall.abort) === null || _a === void 0 ? void 0 : _a.call(pendingCall, (_b = options.signal) === null || _b === void 0 ? void 0 : _b.reason);
                });
            }
            pendingCall.promise = new Promise((resolve, reject) => {
                pendingCall.resolve = (result) => {
                    cleanup();
                    resolve(result);
                };
                pendingCall.reject = (err) => {
                    cleanup();
                    reject(err);
                };
            });
            if (timeoutMs && timeoutMs > 0 && timeoutMs < Infinity) {
                const timeoutError = new TimeoutError("Call timeout");
                pendingCall.timeout = setTimeout(timeoutMs, null, { signal: timeoutAc.signal }).then(() => {
                    var _a;
                    (_a = pendingCall.reject) === null || _a === void 0 ? void 0 : _a.call(pendingCall, timeoutError);
                }).catch(() => { });
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
        var _a;
        if (reason instanceof Buffer) {
            reason = reason.toString('utf8');
        }
        this._rejectPendingCalls("Client disconnected");
        (_a = this._keepAliveAbortController) === null || _a === void 0 ? void 0 : _a.abort();
        this.emit('disconnect', { code, reason });
        if (this._state === StateEnum.CLOSED) {
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
        var _a, _b, _c;
        (_a = this._keepAliveAbortController) === null || _a === void 0 ? void 0 : _a.abort();
        const timerEmitter = new EventEmitter();
        const nextPingTimeout = setTimeoutCb(() => {
            timerEmitter.emit('next');
        }, this._options.pingIntervalMs);
        this._nextPingTimeout = nextPingTimeout;
        try {
            if (this._state !== StateEnum.OPEN) {
                return;
            }
            if (!this._options.pingIntervalMs || this._options.pingIntervalMs <= 0 || this._options.pingIntervalMs > 2147483647) {
                return;
            }
            this._keepAliveAbortController = new AbortController();
            while (true) {
                await once(timerEmitter, 'next', { signal: this._keepAliveAbortController.signal }),
                    this._keepAliveAbortController.signal.throwIfAborted();
                if (this._state !== StateEnum.OPEN) {
                    break;
                }
                if (this._pendingPingResponse) {
                    throw Error("Ping timeout");
                }
                this._lastPingTime = Date.now();
                this._pendingPingResponse = true;
                (_b = this._ws) === null || _b === void 0 ? void 0 : _b.ping();
                nextPingTimeout.refresh();
            }
        }
        catch (err) {
            if (err.name !== 'AbortError') {
                (_c = this._ws) === null || _c === void 0 ? void 0 : _c.terminate();
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
                    this.emit('call', { outbound: false, payload: payload });
                    this._onCall(msgId, method, params);
                    break;
                case MsgType.RESULT:
                    const [result] = more;
                    this.emit('response', { outbound: false, payload: payload });
                    this._onCallResult(msgId, result);
                    break;
                case MsgType.ERROR:
                    const [errorCode, errorDescription, errorDetails] = more;
                    this.emit('response', { outbound: false, payload: payload });
                    this._onCallError(msgId, errorCode, errorDescription, errorDetails);
                    break;
                default:
                    throw new RPCMessageTypeNotSupportedError(`Unexpected message type: ${messageType}`);
            }
            this._badMessagesCount = 0;
        }
        catch (error) {
            const shouldClose = ++this._badMessagesCount > this._options.maxBadMessages;
            let response;
            let errorMessage = '';
            if (![MsgType.ERROR, MsgType.RESULT].includes(messageType)) {
                const details = (error === null || error === void 0 ? void 0 : error.details)
                    || (this._options.respondWithDetailedErrors ? getErrorPlainObject(error) : {});
                errorMessage = error.message || error.rpcErrorMessage || "";
                response = [
                    MsgType.ERROR,
                    msgId,
                    (error === null || error === void 0 ? void 0 : error.rpcErrorCode) || 'GenericError',
                    errorMessage,
                    details !== null && details !== void 0 ? details : {},
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
                if (result === NOREPLY) {
                    return;
                }
                this.emit('callResult', {
                    outbound: false,
                    messageId: msgId,
                    method,
                    params,
                    result,
                });
                payload = [MsgType.RESULT, msgId, result];
                if (this._protocol && this._strictProtocols.includes(this._protocol)) {
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
                const details = (err === null || err === void 0 ? void 0 : err.details)
                    || (this._options.respondWithDetailedErrors ? getErrorPlainObject(err) : {});
                let rpcErrorCode = err.rpcErrorCode || 'GenericError';
                if (this.protocol === 'ocpp1.6') {
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
                    details !== null && details !== void 0 ? details : {},
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
