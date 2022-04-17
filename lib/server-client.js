const RPCClient = require("./client");
const { OPEN } = require("ws");

class RPCServerClient extends RPCClient {
    constructor(options, {ws, request, auth, leadMsgBuffer}) {
        super(options);

        this.request = request;
        this.auth = auth;

        this._state = OPEN;
        this._ws = ws;
        this._attachWebsocket(this._ws, leadMsgBuffer);
    }

    async connect() {
        throw Error("Cannot connect from server to client");
    }
}

module.exports = RPCServerClient;