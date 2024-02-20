/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, Server } from "http";
import { ServerOptions, WebSocket, WebSocketServer } from "ws";
import { EventEmitter } from "stream";
import { Validator } from "./validator";
import RpcServerClient, { IHandshakeInterface } from "./serverClient";
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
interface TPendingUpgrades {
    session: Record<string, any>;
    protocol: string;
    handshake: IHandshakeInterface;
}
declare class RPCServer extends EventEmitter {
    _httpServerAbortControllers: Set<AbortController>;
    _state: number;
    _clients: Set<RpcServerClient>;
    _pendingUpgrades: WeakMap<IncomingMessage, TPendingUpgrades>;
    _options: IOccpServiceOptions;
    _wss: WebSocketServer;
    _strictValidators: Map<string, Validator>;
    authCallback: (accept: (session?: Record<string, any>, protocol?: string | false) => void, reject: (code: number, message: string) => void, handshake: IHandshakeInterface, signal: AbortSignal) => void;
    constructor({ ...options }: IOccpServiceOptions, _callback?: () => void);
    reconfigure(options: any): void;
    _onConnection(websocket: WebSocket, request: IncomingMessage): Promise<void>;
    get handleUpgrade(): (request: IncomingMessage, socket: Socket, head: Buffer) => Promise<void>;
    auth(cb: (accept: (session?: Record<string, any>, protocol?: string | false) => void, reject: (code: number, message: string) => void, handshake: IHandshakeInterface, signal?: AbortSignal) => void): void;
    listen(port: any, host?: any, options?: Record<string, any>): Promise<Server<typeof IncomingMessage, typeof import("http").ServerResponse>>;
    close({ code, reason, awaitPending, force }: Record<string, any>): Promise<void>;
}
export default RPCServer;
