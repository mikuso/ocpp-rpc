import RPCClient from "./client.js";
import { WebSocket } from "ws";
const { OPEN } = WebSocket;

export class RPCServerClient extends RPCClient {
    constructor(options, {ws, handshake, session}) {
        super(options);

        this._session = session;
        this._handshake = handshake;
        
        this._state = OPEN;
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

    async connect() {
        throw Error("Cannot connect from server to client");
    }
}
