import { on } from "node:events";
import { RPCClient } from "./client.js";
import { WebSocket } from "ws";
import { getProtocolFeatureSet } from "./featuresets.js";
import { ConnectionState } from "./util.js";

/**
 * @typedef Handshake
 * @prop {Set.<string>} protocols A set of subprotocols purportedly supported by the client.
 * @prop {string} identity The identity portion of the connection URL, decoded.
 * @prop {Buffer | undefined} password If HTTP Basic auth was used in the connection, and the username correctly matches the identity, this field will contain the password (otherwise undefined). Typically this password would be a string, but the OCPP specs allow for this to be binary, so it is provided as a Buffer for you to interpret as you wish.
 * @prop {string} endpoint The endpoint path portion of the connection URL. This is the part of the path before the identity.
 * @prop {URLSearchParams} query The query string parsed as URLSearchParams.
 * @prop {string} remoteAddress The remote IP address of the socket.
 * @prop {import('node:http').IncomingHttpHeaders} headers The HTTP headers sent in the upgrade request.
 * @prop {import('node:http').IncomingMessage} request The full HTTP request received by the underlying webserver.
 */

/**
 * The RPCServerClient is a subclass of RPCClient. This represents an RPCClient
 * from the server's perspective. It has all the same properties and methods as
 * RPCClient but with a couple of additional properties.
 * @group Classes
 */
export class RPCServerClient extends RPCClient {

    /**
     * @param {import("./client.js").RPCClientOptions} options 
     * @param {object} serverCli
     * @param {WebSocket} serverCli.ws
     * @param {Handshake} serverCli.handshake
     * @param {*} serverCli.session
     */
    constructor(options, {ws, handshake, session}) {
        super(options);

        /** @internal @private */
        this._session = session;
        /** @internal @private */
        this._handshake = handshake;
        
        /** @internal @private */
        this._state = ConnectionState.OPEN;
        /** @internal @private */
        this._identity = this._options.identity;
        /** @internal @private */
        this._ws = ws;
        /** @internal @private */
        this._protocol = ws.protocol;
        this._featureset = getProtocolFeatureSet(this._ws.protocol);
        
        /** @internal @private */
        this._wsAbortController = new AbortController();

        const consumerAbortController = new AbortController();
        const messageAsyncIterator = on(this._ws, 'message', {signal: consumerAbortController.signal});
        this._ws.once('close', (code, reason) => {
            consumerAbortController.abort();
        });

        this._attachWebsocket(this._ws, messageAsyncIterator);
    }

    /**
     * Information collected during the WebSocket connection handshake.
     * @type {Handshake}
     */
    get handshake() {
        return this._handshake;
    }

    /**
     * This property can be anything. This is the value passed to accept() during the authentication callback.
     * @type {*}
     */
    get session() {
        return this._session;
    }

    /**
     * @throws {Error}
     */
    async connect() {
        throw Error("Cannot connect from server to client");
    }
}
