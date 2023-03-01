import { WebSocket } from "ws";
import { EventOpenResult, RPCClient, RPCClientOptions, StateEnum } from "./client";
import { RPCServerClientHandshake } from "./server";

export interface RPCServerClientDependencies {
    ws: WebSocket;
    handshake: RPCServerClientHandshake;
    session: any;
}

export interface RPCServerClientOptions extends RPCClientOptions {
    identity: string;
    reconnect: any;
    callTimeoutMs: any;
    pingIntervalMs: any;
    deferPingsOnActivity: any;
    respondWithDetailedErrors: any;
    callConcurrency: any;
    strictMode: any;
    strictModeValidators: any;
    maxBadMessages: any;
    protocols: any;
}


export class RPCServerClient extends RPCClient {
    private _session: any;
    private _handshake: RPCServerClientHandshake;

    constructor(options: RPCServerClientOptions, {ws, handshake, session}: RPCServerClientDependencies) {
        super(options);

        this._session = session;
        this._handshake = handshake;
        
        this._state = StateEnum.OPEN;
        this._identity = this._options.identity;
        this._ws = ws;
        this._protocol = ws.protocol;
        this._attachWebsocket(this._ws);
    }

    get handshake() {
        return this._handshake;
    }

    get session() {
        return this._session;
    }

    async connect(): Promise<EventOpenResult> {
        throw Error("Cannot connect from server to client");
    }
}
