/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'node:events';
import { WebSocket, RawData } from 'ws';
import { NOREPLY } from './symbols';
import { OCPPErrorType } from './util';
import EventBuffer from './event-buffer';
import { Validator } from './validator';
import { IncomingMessage } from 'node:http';
export declare enum MsgType {
    UNKNOWN = -1,
    CALL = 2,
    RESULT = 3,
    ERROR = 4
}
export interface EventOpenResult {
    response: IncomingMessage;
}
type BufferLike = string | RawData;
type CallReplyValue = object | typeof NOREPLY;
export interface RPCBaseClientOptions {
    query?: string | string[][] | URLSearchParams;
    identity: string;
    endpoint: URL | string;
    password?: Buffer;
    callTimeoutMs?: number;
    pingIntervalMs?: number;
    deferPingsOnActivity?: boolean;
    headers?: {};
    protocols?: string[];
    reconnect?: boolean;
    respondWithDetailedErrors?: boolean;
    callConcurrency?: number;
    maxBadMessages?: number;
    strictMode?: boolean | string[];
    strictModeValidators?: Validator[];
}
export declare enum StateEnum {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
}
interface CloseOptions {
    code?: number;
    reason?: string;
    awaitPending?: boolean;
    force?: boolean;
}
export interface CloseEvent {
    code?: number;
    reason?: string | Buffer;
}
type HandlerReplyPayload = object | Error | Promise<object> | Promise<Error>;
interface HandlerCallbackArgs {
    method: string;
    params: any;
    signal: AbortSignal;
    messageId: string;
    reply: (payload: HandlerReplyPayload) => void;
}
type HandlerCallback = (options: HandlerCallbackArgs) => {};
interface CallOptions {
    noReply?: boolean;
    callTimeoutMs?: number;
    signal?: AbortSignal;
}
type OCPPCallPayload = [MsgType.CALL, string, string, object];
type OCPPResultPayload = [MsgType.RESULT, string, object];
type OCPPErrorPayload = [MsgType.ERROR, string, string, string, object];
interface BadMessageEvent {
    buffer: RawData;
    error: Error;
    response?: OCPPErrorPayload;
}
export interface RPCBaseClientEvents {
    'badMessage': (event: BadMessageEvent) => void;
    'call': (event: {
        outbound: boolean;
        payload: OCPPCallPayload;
    }) => void;
    'callResult': (event: {
        outbound: boolean;
        messageId: string;
        method: string;
        params: object;
        result: object;
    }) => void;
    'callError': (event: {
        outbound: boolean;
        messageId: string;
        method: string;
        params: object;
        error: Error;
    }) => void;
    'close': (event: CloseEvent) => void;
    'closing': () => void;
    'disconnect': (event: CloseEvent) => void;
    'message': (event: {
        message: BufferLike;
        outbound: boolean;
    }) => void;
    'ping': (event: {
        rtt: number;
    }) => void;
    'response': (event: {
        outbound: boolean;
        payload: OCPPResultPayload | OCPPErrorPayload;
    }) => void;
    'socketError': (error: Error) => void;
    'strictValidationFailure': (event: {
        messageId: string;
        method: string;
        params: object;
        result: object | null;
        error: Error;
        outbound: boolean;
        isCall: boolean;
    }) => void;
}
export declare interface RPCBaseClient {
    on<U extends keyof RPCBaseClientEvents>(event: U, listener: RPCBaseClientEvents[U]): this;
    emit<U extends keyof RPCBaseClientEvents>(event: U, ...args: Parameters<RPCBaseClientEvents[U]>): boolean;
}
export declare class RPCBaseClient extends EventEmitter {
    protected _identity: string;
    private _wildcardHandler?;
    private _handlers;
    protected _state: StateEnum;
    private _callQueue;
    protected _ws?: WebSocket;
    protected _wsAbortController?: AbortController;
    protected _keepAliveAbortController?: AbortController;
    protected _pendingPingResponse: boolean;
    private _lastPingTime;
    private _closePromise?;
    protected _protocolOptions: string[];
    protected _protocol?: string;
    private _strictProtocols;
    private _strictValidators;
    private _pendingCalls;
    private _pendingResponses;
    protected _outboundMsgBuffer: BufferLike[];
    protected _connectedOnce: boolean;
    private _badMessagesCount;
    protected _reconnectAttempt: number;
    protected _options: RPCBaseClientOptions;
    protected _connectPromise?: Promise<EventOpenResult>;
    private _nextPingTimeout?;
    constructor(options: RPCBaseClientOptions);
    get identity(): string;
    get protocol(): string | undefined;
    get state(): StateEnum;
    reconfigure(options: RPCBaseClientOptions): void;
    /**
     * Send a message to the RPCServer. While socket is connecting, the message is queued and send when open.
     * @param {Buffer|String} message - String to send via websocket
     */
    sendRaw(message: BufferLike): void;
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
    close({ code, reason, awaitPending, force }?: CloseOptions): Promise<CloseEvent>;
    handle(handler: HandlerCallback): void;
    handle(method: string, handler: HandlerCallback): void;
    /**
     *
     * @param {string} [method] - The name of the handled method.
     */
    removeHandler(method?: string): void;
    removeAllHandlers(): void;
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
    call(method: string, params: object, options?: CallOptions): Promise<unknown>;
    _call(method: string, params: object, options?: CallOptions): Promise<any>;
    /**
     * Start consuming from a WebSocket
     * @param {WebSocket} ws - A WebSocket instance
     * @param {EventBuffer} leadMsgBuffer - A buffer which traps all 'message' events
     */
    protected _attachWebsocket(ws: WebSocket, leadMsgBuffer?: EventBuffer): void;
    _rejectPendingCalls(abortReason: string): void;
    _awaitUntilPendingSettled(): Promise<PromiseSettledResult<CallReplyValue | OCPPErrorPayload | OCPPResultPayload>[]>;
    protected _handleDisconnect({ code, reason }: CloseEvent): void;
    _deferNextPing(): void;
    _keepAlive(): Promise<void>;
    _onMessage(buffer: RawData): void;
    _onCall(msgId: string, method: string, params: object): Promise<void>;
    _onCallResult(msgId: string, result: object): void;
    _onCallError(msgId: string, errorCode: OCPPErrorType, errorDescription: string, errorDetails: object): void;
}
export {};
