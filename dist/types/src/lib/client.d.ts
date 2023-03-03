/// <reference types="node" />
/// <reference types="node" />
import { WebSocket, ClientOptions } from 'ws';
import { ExponentialOptions } from 'backoff';
import { Validator } from './validator';
import { IncomingMessage } from 'node:http';
import { CloseEvent, RPCBaseClient, RPCBaseClientOptions } from './baseclient';
export interface EventOpenResult {
    response: IncomingMessage;
}
export interface RPCClientOptions extends RPCBaseClientOptions {
    identity: string;
    endpoint: URL | string;
    password?: Buffer;
    callTimeoutMs: number;
    pingIntervalMs: number;
    deferPingsOnActivity: boolean;
    wsOpts: ClientOptions;
    headers: {};
    protocols: string[];
    reconnect: boolean;
    maxReconnects: number;
    respondWithDetailedErrors: boolean;
    callConcurrency: number;
    maxBadMessages: number;
    strictMode: boolean;
    strictModeValidators: Validator[];
    backoff: ExponentialOptions;
}
export declare enum StateEnum {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
}
export declare class RPCClient extends RPCBaseClient {
    protected _identity: string;
    protected _state: StateEnum;
    protected _ws?: WebSocket;
    protected _protocol?: string;
    protected _options: RPCClientOptions;
    private _backoffStrategy;
    protected _connectionUrl: URL;
    constructor(options: RPCClientOptions);
    reconfigure(options: RPCClientOptions): void;
    /**
     * Attempt to connect to the RPCServer.
     * @returns {Promise<undefined>} Resolves when connected, rejects on failure
     */
    connect(): Promise<EventOpenResult>;
    protected _handleDisconnect({ code, reason }: CloseEvent): void;
    private _beginConnect;
    private _tryReconnect;
}
