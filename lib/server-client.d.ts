/// <reference types="node" />
/// <reference types="node" />
import WebSocket from "ws";
import RPC_Client, { RPC_ClientOptions } from "./client";
import { IncomingHttpHeaders, IncomingMessage } from "http";
export interface IHandshakeInterface {
    remoteAddress: string | undefined;
    headers: IncomingHttpHeaders;
    protocols: Set<string>;
    endpoint: string;
    identity: string;
    query: URLSearchParams;
    request: IncomingMessage;
    password: Buffer | undefined;
}
declare class RpcServerClient extends RPC_Client {
    private _session;
    private _handshake;
    constructor({ ...options }: RPC_ClientOptions, { ws, handshake, session, }: {
        ws: WebSocket;
        session: Record<string, any>;
        handshake: IHandshakeInterface;
    });
    get handshake(): IHandshakeInterface;
    get session(): Record<string, any>;
    connect(): Promise<void>;
}
export default RpcServerClient;
