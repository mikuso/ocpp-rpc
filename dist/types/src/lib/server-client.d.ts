import { WebSocket } from "ws";
import { RPCBaseClient, RPCBaseClientOptions } from "./baseclient";
import { RPCServerClientHandshake } from "./server";
export interface RPCServerClientDependencies {
    ws: WebSocket;
    handshake: RPCServerClientHandshake;
    session: any;
}
export declare class RPCServerClient extends RPCBaseClient {
    private _session;
    private _handshake;
    constructor(options: RPCBaseClientOptions, { ws, handshake, session }: RPCServerClientDependencies);
    get handshake(): RPCServerClientHandshake;
    get session(): any;
}
