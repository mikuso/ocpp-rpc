/// <reference types="node" />
import { WebSocket, ClientOptions } from 'ws';
import { ExponentialOptions } from 'backoff';
import { IncomingMessage } from 'node:http';
import { CloseEvent, RPCBaseClient, RPCBaseClientEvents, RPCBaseClientOptions } from './baseclient';
export interface OpenEvent {
    response: IncomingMessage;
}
export interface RPCClientOptions extends RPCBaseClientOptions {
    query?: string | string[][] | URLSearchParams | Record<string, string>;
    wsOpts?: ClientOptions;
    maxReconnects?: number;
    backoff?: ExponentialOptions;
}
export declare enum StateEnum {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
}
interface RPCClientEvents extends RPCBaseClientEvents {
    'protocol': (protocol?: string) => void;
    'open': (result: OpenEvent) => void;
    'connecting': (event: {
        protocols: string[];
    }) => void;
}
export declare interface RPCClient {
    on<U extends keyof RPCClientEvents>(event: U, listener: RPCClientEvents[U]): this;
    emit<U extends keyof RPCClientEvents>(event: U, ...args: Parameters<RPCClientEvents[U]>): boolean;
}
export declare class RPCClient extends RPCBaseClient {
    protected _identity: string;
    protected _state: StateEnum;
    protected _ws?: WebSocket;
    protected _protocol?: string;
    protected _options: RPCClientOptions;
    private _backoffStrategy;
    protected _connectPromise?: Promise<OpenEvent>;
    protected _connectionUrl: URL;
    constructor(options: RPCClientOptions);
    reconfigure(options: Partial<RPCClientOptions>): void;
    /**
     * Attempt to connect to the RPCServer.
     * @returns {Promise<undefined>} Resolves when connected, rejects on failure
     */
    connect(): Promise<OpenEvent>;
    protected _handleDisconnect({ code, reason }: CloseEvent): void;
    private _beginConnect;
    private _tryReconnect;
}
export {};
