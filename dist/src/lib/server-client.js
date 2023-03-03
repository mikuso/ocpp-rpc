import { RPCBaseClient } from "./baseclient";
import { StateEnum } from "./client";
export class RPCServerClient extends RPCBaseClient {
    _session;
    _handshake;
    constructor(options, { ws, handshake, session }) {
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
    async connect() {
        throw Error("Cannot connect from server to client");
    }
}
