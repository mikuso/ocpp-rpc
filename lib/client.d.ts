/// <reference types="node" />
import EventEmitter from "events";
import { Validator } from "./validator";
import WebSocket from "ws";
import EventBuffer from "./event-buffer";
export interface RPC_ClientOptions {
    identity: string;
    reconnect: boolean;
    callTimeoutMs: number;
    pingIntervalMs: number;
    deferPingsOnActivity: boolean;
    respondWithDetailedErrors: boolean;
    callConcurrency: number;
    strictMode: boolean | string[];
    strictModeValidators: Validator[];
    maxBadMessages: number;
    protocols: string[];
    endpoint?: string;
    password: string | null;
    wsOpts: any;
    headers: any;
    maxReconnects: number;
    query?: string | Record<string, any>;
    backoff: {
        initialDelay: number;
        maxDelay: number;
        factor: number;
        randomisationFactor: number;
    };
}
export interface IHandlersOption {
    messageId?: string;
    method?: string;
    params?: Record<string, any>;
    signal?: AbortSignal;
    reply?: unknown;
}
type IHandlers = ({ params, reply, method, signal, messageId, }: IHandlersOption) => Promise<Record<string, any>>;
declare class RPC_Client extends EventEmitter {
    protected _identity?: string;
    private _wildcardHandler;
    private _handlers;
    protected _state: number;
    private _callQueue;
    protected _ws?: WebSocket;
    private _wsAbortController?;
    private _keepAliveAbortController?;
    private _pendingPingResponse;
    private _lastPingTime;
    private _closePromise?;
    private _protocolOptions;
    protected _protocol?: string;
    private _strictProtocols;
    private _strictValidators?;
    private _pendingCalls;
    private _pendingResponses;
    private _outboundMsgBuffer;
    private _connectedOnce;
    private _backoffStrategy?;
    private _badMessagesCount;
    private _reconnectAttempt;
    protected _options: RPC_ClientOptions;
    private _connectionUrl;
    private _connectPromise;
    private _nextPingTimeout;
    static OPEN: number;
    static CONNECTING: number;
    static CLOSING: number;
    static CLOSED: number;
    constructor({ ...options }: RPC_ClientOptions);
    get identity(): string | undefined;
    get protocol(): string | undefined;
    get state(): number;
    reconfigure(options: RPC_ClientOptions): void;
    /**
     * Attempt to connect to the RPCServer.
     * @returns {Promise<undefined>} Resolves when connected, rejects on failure
     */
    connect(): Promise<any>;
    private _keepAlive;
    private _tryReconnect;
    private _beginConnect;
    /**
     * Start consuming from a WebSocket
     * @param {WebSocket} ws - A WebSocket instance
     * @param {EventBuffer} leadMsgBuffer - A buffer which traps all 'message' events
     */
    protected _attachWebsocket(ws: WebSocket, leadMsgBuffer?: EventBuffer): void;
    private _handleDisconnect;
    private _rejectPendingCalls;
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
    call(method: any, params?: any, options?: Record<string, any>): Promise<unknown>;
    private _call;
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
    close({ code, reason, awaitPending, force, }?: {
        code?: number;
        reason?: string;
        awaitPending?: any;
        force?: any;
    }): Promise<{
        code: number | undefined;
        reason: string | undefined;
    } | undefined>;
    private _awaitUntilPendingSettled;
    private _deferNextPing;
    private _onMessage;
    private _onCall;
    private _onCallResult;
    private _onCallError;
    /**
     * Send a message to the RPCServer. While socket is connecting, the message is queued and send when open.
     * @param {Buffer|String} message - String to send via websocket
     */
    sendRaw(message: string): void;
    /**
     *
     * @param {string} [method] - The name of the handled method.
     */
    removeHandler(method: string): void;
    removeAllHandlers(): void;
    /**
     *
     * @param {string} [method] - The name of the RPC method to handle.
     * @param {Function} handler - A function that can handle incoming calls for this method.
     */
    handle(method: string | IHandlers, handler?: IHandlers): void;
}
export default RPC_Client;
