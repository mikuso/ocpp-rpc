/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from "events";
import { Validator } from "./validator";
import Queue from "./queue";
import WebSocket from "ws";
import { ExponentialStrategy } from "backoff";
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
declare class RPC_Client extends EventEmitter {
    _identity?: string;
    _wildcardHandler: Function | null;
    _handlers: Map<string, Function>;
    _state: number;
    _callQueue: Queue;
    _ws?: WebSocket;
    _wsAbortController?: AbortController;
    _keepAliveAbortController?: AbortController;
    _pendingPingResponse: boolean;
    _lastPingTime: number;
    _closePromise?: Promise<{
        code: number;
        reason: string;
    }>;
    _protocolOptions: string[];
    _protocol?: string;
    _strictProtocols: string[];
    _strictValidators?: Map<string, Validator>;
    _pendingCalls: Map<string, Record<string, any>>;
    _pendingResponses: Map<string, {
        abort: {
            (reason?: any): void;
            (reason?: any): void;
        };
        promise: Promise<any>;
    }>;
    _outboundMsgBuffer: string[];
    _connectedOnce: boolean;
    _backoffStrategy?: ExponentialStrategy;
    _badMessagesCount: number;
    _reconnectAttempt: number;
    _options: RPC_ClientOptions;
    _connectionUrl: string;
    _connectPromise: Promise<{
        response: any;
    }>;
    _nextPingTimeout: NodeJS.Timeout;
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
    _keepAlive(): Promise<void>;
    _tryReconnect(): Promise<void>;
    _beginConnect(): Promise<{
        response: any;
    }>;
    /**
     * Start consuming from a WebSocket
     * @param {WebSocket} ws - A WebSocket instance
     * @param {EventBuffer} leadMsgBuffer - A buffer which traps all 'message' events
     */
    _attachWebsocket(ws: WebSocket, leadMsgBuffer?: EventBuffer): void;
    _handleDisconnect({ code, reason }: {
        code: number;
        reason: Buffer;
    }): void;
    _rejectPendingCalls(abortReason: string): void;
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
    _call(method: any, params: any, options?: Record<string, any>): Promise<any>;
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
    close({ code, reason, awaitPending, force, }: {
        code?: number;
        reason?: string;
        awaitPending?: any;
        force?: any;
    }): Promise<{
        code: number | undefined;
        reason: string | undefined;
    } | undefined>;
    _awaitUntilPendingSettled(): Promise<PromiseSettledResult<any>[]>;
    _deferNextPing(): void;
    _onMessage(buffer: Buffer): void;
    _onCall(msgId: string, method: string, params: any): Promise<void>;
    _onCallResult(msgId: string, result: any): any;
    _onCallError(msgId: string, errorCode: string, errorDescription: string, errorDetails: Record<string, any>): void;
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
    handle(method: string | Function, handler?: ({ params, signal }: {
        params: any;
        signal: any;
    }) => void): void;
}
export default RPC_Client;
