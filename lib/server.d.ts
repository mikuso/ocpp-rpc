/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, Server } from "http";
import { ServerOptions } from "ws";
import { EventEmitter } from "stream";
import { Validator } from "./validator";
import { IHandshakeInterface } from "./server-client";
import { Socket } from "net";
interface IOccpServiceOptions {
    wssOptions?: ServerOptions;
    protocols?: string[];
    callTimeoutMs?: number;
    pingIntervalMs?: number;
    deferPingsOnActivity?: boolean;
    respondWithDetailedErrors?: boolean;
    callConcurrency?: number;
    maxBadMessages?: number;
    strictMode?: boolean | string[];
    strictModeValidators?: Validator[];
}
declare class RPCServer extends EventEmitter {
    private _httpServerAbortControllers;
    private _state;
    private _clients;
    private _pendingUpgrades;
    private _options;
    private _wss;
    private _strictValidators;
    authCallback: (accept: (session?: Record<string, any>, protocol?: string | false) => void, reject: (code: number, message: string) => void, handshake: IHandshakeInterface, signal: AbortSignal) => void;
    constructor({ ...options }: IOccpServiceOptions, _callback?: () => void);
    reconfigure(options: any): void;
    private _onConnection;
    get handleUpgrade(): (request: IncomingMessage, socket: Socket, head: Buffer) => Promise<void>;
    auth(cb: (accept: (session?: Record<string, any>, protocol?: string | false) => void, reject: (code: number, message: string) => void, handshake: IHandshakeInterface, signal?: AbortSignal) => void): void;
    listen(port: any, host?: any, options?: Record<string, any>): Promise<Server<typeof IncomingMessage, typeof import("http").ServerResponse>>;
    close({ code, reason, awaitPending, force }: Record<string, any>): Promise<void>;
}
export default RPCServer;
