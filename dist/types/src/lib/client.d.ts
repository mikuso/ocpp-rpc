/// <reference types="node" />
import { WebSocket, ClientOptions } from 'ws';
import { ExponentialOptions } from 'backoff';
import { IncomingMessage } from 'node:http';
import { CloseEvent, RPCBaseClient, RPCBaseClientOptions } from './baseclient';
export interface EventOpenResult {
    response: IncomingMessage;
}
export interface RPCClientOptions extends RPCBaseClientOptions {
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
export declare interface RPCClient {
    on(event: 'close', listener: (event: CloseEvent) => void): this;
    on(event: 'disconnect', listener: (event: CloseEvent) => void): this;
    on(event: 'protocol', listener: (protocol?: string) => void): this;
    on(event: 'open', listener: (result: EventOpenResult) => void): this;
    on(event: 'connecting', listener: (event: {
        protocols: string[];
    }) => void): this;
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
