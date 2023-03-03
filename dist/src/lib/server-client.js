"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCServerClient = void 0;
const baseclient_1 = require("./baseclient");
const client_1 = require("./client");
class RPCServerClient extends baseclient_1.RPCBaseClient {
    _session;
    _handshake;
    constructor(options, { ws, handshake, session }) {
        super(options);
        this._session = session;
        this._handshake = handshake;
        this._state = client_1.StateEnum.OPEN;
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
}
exports.RPCServerClient = RPCServerClient;
