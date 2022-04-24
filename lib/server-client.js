const RPCClient = require("./client");
const { OPEN } = require("ws");

class RPCServerClient extends RPCClient {
    constructor(options, {ws, handshake, session, identity}) {
        super(options);

        this._session = session;
        this._handshake = handshake;
        
        this._state = OPEN;
        this._identity = identity;
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

module.exports = RPCServerClient;