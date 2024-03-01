import { WebSocket } from "ws";
import { RPCBaseClient, RPCBaseClientOptions } from "./baseclient";
import { RPCServerClientHandshake } from "./server";
import { ProtocolNames } from "./protocols";
export interface RPCServerClientDependencies {
    query?: string | string[][] | URLSearchParams;
    ws: WebSocket;
    handshake: RPCServerClientHandshake;
    session: any;
}
export declare class RPCServerClient<T extends ProtocolNames> extends RPCBaseClient<T> {
    private _session;
    private _handshake;
    constructor(options: RPCBaseClientOptions, { ws, handshake, session }: RPCServerClientDependencies);
    get handshake(): RPCServerClientHandshake;
    get session(): any;
}
