/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';
import { Validator } from './validator';
import { Socket } from 'net';
import { TLSSocket } from 'tls';
import { URLSearchParams } from 'url';
export interface RPCServerClientHandshake {
    protocols: Set<string>;
    identity: string;
    password?: Buffer;
    endpoint: string;
    query: URLSearchParams;
    remoteAddress: string;
    headers: object;
    request: IncomingMessage;
}
interface RPCServerOptionsReconfigurable {
    protocols: string[];
    callTimeoutMs: number;
    pingIntervalMs: number;
    deferPingsOnActivity: boolean;
    respondWithDetailedErrors: boolean;
    callConcurrency: number;
    maxBadMessages: number;
    strictMode: boolean | string[];
    strictModeValidators: Validator[];
}
interface ListenOptions {
    signal?: AbortSignal;
}
interface RPCServerOptions extends RPCServerOptionsReconfigurable {
    wssOptions: object;
}
type AuthCallback = (accept: (session?: any, protocol?: string) => void, reject: (code?: number, message?: string) => void, handshake: RPCServerClientHandshake, signal: AbortSignal) => {};
interface ServerCloseOptions {
    code?: number;
    reason?: string;
    awaitPending?: boolean;
    force?: boolean;
}
export declare class RPCServer extends EventEmitter {
    private _httpServerAbortControllers;
    private _state;
    private _clients;
    private _pendingUpgrades;
    private _options;
    private _wss;
    private _strictValidators;
    private _authCallback?;
    constructor(options: RPCServerOptions);
    reconfigure(options: RPCServerOptionsReconfigurable): void;
    get handleUpgrade(): (request: IncomingMessage, socket: Socket | TLSSocket, head: Buffer) => Promise<void>;
    _onConnection(websocket: WebSocket, request: IncomingMessage): Promise<void>;
    auth(cb?: AuthCallback): void;
    listen(port: number, host: string, options?: ListenOptions): Promise<import("http").Server<typeof IncomingMessage, typeof import("http").ServerResponse>>;
    close({ code, reason, awaitPending, force }?: ServerCloseOptions): Promise<void>;
}
export {};
