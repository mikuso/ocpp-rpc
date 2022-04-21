const RPCClient = require("./client");
const { OPEN } = require("ws");

class RPCServerClient extends RPCClient {
    constructor(options, {ws, request, session, identity}) {
        super(options);

        this.request = request;
        this.session = session;
        
        this._identity = identity;
        this._state = OPEN;
        this._ws = ws;
        this._attachWebsocket(this._ws);
    }

    async connect() {
        throw Error("Cannot connect from server to client");
    }
}

module.exports = RPCServerClient;