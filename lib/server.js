import { EventEmitter, once } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
const { OPEN, CLOSING, CLOSED } = WebSocket;
import { createServer } from 'http';
import { RPCServerClient } from './server-client.js';
import { abortHandshake, parseSubprotocols } from './ws-util.js';
import standardValidators from './standard-validators.js';
import { getPackageIdent } from './util.js';
import { WebsocketUpgradeError } from './errors.js';

/**
 * @callback ClientAcceptCallback
 * Call this function to accept the client, causing the server to emit a `'client'` event.
 * 
 * @param {*} [session] Optional value attached to the resulting client as `client.session`. Defaults to `{}` if omitted.
 * @param {string} [protocol] Optionally override subprotocol selection. When omitted, the first mutually-supported subprotocol (in server preference order) is used. Passing a protocol that the client did not advertise rejects the connection with HTTP 400.
 * @returns {void}
 */

/**
 * @callback ClientRejectCallback
 * Call this function to reject the incoming client. This causes the server to emit an `'upgradeAborted'` event.
 * 
 * @param {number} code HTTP status code to reject the connection with. Defaults to `404`.
 * @param {string} message HTTP response body. Defaults to `'Not found'`.
 * @returns {void}
 */

/**
 * Called by the server before accepting each incoming WebSocket connection. Must call either
 * `accept` or `reject` exactly once; subsequent calls to either function are silently ignored.
 * The callback may be `async`.
 *
 * @callback AuthCallback
 * @param {ClientAcceptCallback} accept - Call this function to accept the connection and cause the server to emit a `'client'` event.
 * @param {ClientRejectCallback} reject - Call this function to reject the connection and cause the server to emit an `'upgradeAborted'` event.
 * @param {import('./server-client.js').Handshake} handshake - Details of the incoming connection (identity, password, headers, query string, remote address, etc.).
 * @param {AbortSignal} signal - Aborts if the underlying socket is closed before authentication completes. `signal.reason` is the triggering error and is also available as the `error` property of the corresponding `'upgradeAborted'` event.
 * @returns {void | Promise<void>}
 */

/**
 * @typedef RPCServerOptions
 * @prop {string[]} [protocols=[]] Array of subprotocols supported by this server. Can be overridden in an auth callback.
 * @prop {number} [callTimeoutMs=30000] Milliseconds to wait before unanswered outbound calls are rejected automatically.
 * @prop {number} [pingIntervalMs=30000] Milliseconds between WebSocket pings to connected clients. Used for keep-alive timeouts.
 * @prop {boolean} [deferPingsOnActivity=false] Should connected clients skip sending keep-alive pings if other data is being regularly received? Enabling this option can help reduce data usage (especially on TLS-secured connections), but may cause compatibility issues with some real-world clients as they might treat an absence of pings to mean the connection to the server is lost.
 * @prop {boolean} [respondWithDetailedErrors=false] Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. This may be undesirable in a production environment as it leaks the call stack of the handler.
 * @prop {number} [callConcurrency=1] The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. There is no concurrency limit imposed on inbound calls. OCPP requires this to be set to `1`, but you may choose other values for non-OCPP/custom protocols.
 * @prop {boolean|Array.<string>} [strictMode=false] Enable strict validation of calls & responses. Pass an array of subprotocol names to limit strict mode to specific protocols.
 * @prop {Array.<Validator>} [strictModeValidators=[]] Optional additional validators to be used in conjunction with strictMode.
 * @prop {number} [maxBadMessages=Infinity] The maximum number of non-conforming RPC messages which can be tolerated before the client is automatically closed.
 * @prop {WebSocket.ServerOptions} [wssOptions={}] Additional [WebSocketServer options](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback) from the WS library.
 */

/**
 * @group Classes
 */
export class RPCServer extends EventEmitter {

    /**
     * Emitted when a client has connected and been accepted. By default, a client is automatically
     * accepted if it connects with a matching subprotocol (as per the `protocols` option). This
     * behaviour can be overridden by setting an auth handler via server.auth().
     * @event
     * @overload
     * @param {'client'} event
     * @param {(client: RPCServerClient) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the underlying WebSocketServer emits an error.
     * @event
     * @overload
     * @param {'error'} event
     * @param {(error: Error) => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the server has fully closed and all clients have been disconnected.
     * @event
     * @overload
     * @param {'close'} event
     * @param {() => void} listener
     * @returns {this}
     */
    /**
     * Emitted when the server has begun closing. Beyond this point, no more clients will be
     * accepted and the 'client' event will no longer fire.
     * @event
     * @overload
     * @param {'closing'} event
     * @param {() => void} listener
     * @returns {this}
     */
    /**
     * Emitted when a websocket upgrade has been aborted. This could be caused by an authentication
     * rejection, socket error, or websocket handshake error.
     * @event
     * @overload
     * @param {'upgradeAborted'} event
     * @param {(data: {error: Error, socket: import('net').Socket, request: import('http').IncomingMessage, identity: string}) => void} listener
     * @returns {this}
     */
    /**
     * @overload
     * @param {string} event
     * @param {(...args: any[]) => void} listener
     * @returns {this}
     */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * @param {RPCServerOptions} [options]
     */
    constructor(options) {
        super();
        
        /** @internal */
        this._httpServerAbortControllers = new Set();
        /** @internal */
        this._state = OPEN;
        /** @internal */
        this._clients = new Set();
        /** @internal */
        this._pendingUpgrades = new WeakMap();
        /** @internal */
        this._strictValidators = undefined;
        /** @internal */
        this._authCallback = undefined;

        /** @internal */
        this._options = {
            protocols: [],
            callTimeoutMs: 1000*30,
            pingIntervalMs: 1000*30,
            deferPingsOnActivity: false,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
            maxBadMessages: Infinity,
            strictMode: false,
            strictModeValidators: [],
        };

        this.reconfigure(options || {});

        /** @internal */
        this._wss = new WebSocketServer({
            ...this._options.wssOptions,
            noServer: true,
            handleProtocols: (protocols, request) => {
                const {protocol} = this._pendingUpgrades.get(request);
                return protocol;
            },
        });

        this._wss.on('headers', h => h.push(`Server: ${getPackageIdent()}`));
        this._wss.on('error', err => this.emit('error', err));
        this._wss.on('connection', this._onConnection.bind(this));
    }
    
    /**
     * Use this method to change any of the options that can be passed to the RPCServer's constructor.
     *
     * @param {RPCServerOptions} options
     */
    reconfigure(options) {
        const newOpts = Object.assign({}, this._options, options);

        if (newOpts.strictMode && !newOpts.protocols?.length) {
            throw Error(`strictMode requires at least one subprotocol`);
        }

        const strictValidators = [...standardValidators];
        if (newOpts.strictModeValidators) {
            strictValidators.push(...newOpts.strictModeValidators);
        }

        this._strictValidators = strictValidators.reduce((svs, v) => {
            svs.set(v.subprotocol, v);
            return svs;
        }, new Map());
        
        let strictProtocols = [];
        if (Array.isArray(newOpts.strictMode)) {
            strictProtocols = newOpts.strictMode;
        } else if (newOpts.strictMode) {
            strictProtocols = newOpts.protocols;
        }

        const missingValidator = strictProtocols.find(protocol => !this._strictValidators.has(protocol));
        if (missingValidator) {
            throw Error(`Missing strictMode validator for subprotocol '${missingValidator}'`);
        }

        this._options = newOpts;
    }

    /**
     * Converts an HTTP upgrade request into a WebSocket client to be handled by this RPCServer.
     * This method is bound to the server instance, so it is suitable to pass directly as an
     * http.Server's 'upgrade' event handler.
     * 
     * @example
     * ```
     * import http from 'node:http';
     * import { RPCServer } from 'ocpp-rpc';
     * 
     * const httpServer = http.createServer();
     * const rpcServer = new RPCServer();
     * 
     * httpServer.on('upgrade', rpcServer.handleUpgrade);
     * ```
     */
    get handleUpgrade() {
        /**
         * @param {http.IncomingMessage} request - The HTTP upgrade request
         * @param {net.Socket} socket - Network socket between the server and client
         * @param {Buffer} head - The first packet of the upgraded stream (may be empty)
         * @returns {Promise<void>}
         */
        return async (request, socket, head) => {

            let resolved = false;

            const ac = new AbortController();
            const {signal} = ac;

            const url = new URL('http://localhost' + (request.url || '/'));
            const pathParts = url.pathname.split('/');
            const identity = decodeURIComponent(pathParts.pop());

            const abortUpgrade = (error) => {
                resolved = true;

                if (error && error instanceof WebsocketUpgradeError) {
                    abortHandshake(socket, error.code, error.message);
                } else {
                    abortHandshake(socket, 500);
                }

                if (!signal.aborted) {
                    ac.abort(error);
                    this.emit('upgradeAborted', {
                        error,
                        socket,
                        request,
                        identity,
                    });
                }
            };

            socket.on('error', (err) => {
                abortUpgrade(err);
            });

            try {
                if (this._state !== OPEN) {
                    throw new WebsocketUpgradeError(500, "Server not open");
                }
                
                if (socket.readyState !== 'open') {
                    throw new WebsocketUpgradeError(400, `Client readyState = '${socket.readyState}'`);
                }
                
                const headers = request.headers;

                if (headers.upgrade.toLowerCase() !== 'websocket') {
                    throw new WebsocketUpgradeError(400, "Can only upgrade websocket upgrade requests");
                }
                
                const endpoint = pathParts.join('/') || '/';
                const remoteAddress = request.socket.remoteAddress;
                const protocols = ('sec-websocket-protocol' in request.headers)
                    ? parseSubprotocols(request.headers['sec-websocket-protocol'])
                    : new Set();

                let password;
                if (headers.authorization) {
                    try {
                        /**
                         * This is a non-standard basic auth parser because it supports
                         * colons in usernames (which is normally disallowed).
                         * However, this shouldn't cause any confusion as we have a
                         * guarantee from OCPP that the username will always be equal to
                         * the identity.
                         * It also supports binary passwords, which is also a spec violation
                         * but is necessary for allowing truly random binary keys as
                         * recommended by the OCPP security whitepaper.
                         */
                        const b64up = headers.authorization.match(/^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/)[1];
                        const userPassBuffer = Buffer.from(b64up, 'base64');

                        const clientIdentityUserBuffer = Buffer.from(identity + ':');

                        if (clientIdentityUserBuffer.compare(userPassBuffer, 0, clientIdentityUserBuffer.length) === 0) {
                            // first part of buffer matches `${identity}:`
                            password = userPassBuffer.subarray(clientIdentityUserBuffer.length);
                        }
                    } catch (err) {
                        // failing to parse authorization header is no big deal.
                        // just leave password as undefined as if no header was sent.
                    }
                }

                const handshake = {
                    remoteAddress,
                    headers,
                    protocols,
                    endpoint,
                    identity,
                    query: url.searchParams,
                    request,
                    password,
                };

                const accept = (session, protocol) => {
                    if (resolved) return;
                    resolved = true;
                    
                    try {
                        if (socket.readyState !== 'open') {
                            throw new WebsocketUpgradeError(400, `Client readyState = '${socket.readyState}'`);
                        }

                        if (protocol === undefined) {
                            // pick first subprotocol (preferred by server) that is also supported by the client
                            protocol = (this._options.protocols ?? []).find(p => protocols.has(p));
                        } else if (protocol !== false && !protocols.has(protocol)) {
                            throw new WebsocketUpgradeError(400, `Client doesn't support expected subprotocol`);
                        }

                        // cache auth results for connection creation
                        this._pendingUpgrades.set(request, {
                            session: session ?? {},
                            protocol,
                            handshake
                        });

                        this._wss.handleUpgrade(request, socket, head, ws => {
                            this._wss.emit('connection', ws, request);
                        });
                    } catch (err) {
                        abortUpgrade(err);
                    }
                };

                const reject = (code = 404, message = 'Not found') => {
                    if (resolved) return;
                    resolved = true;
                    abortUpgrade(new WebsocketUpgradeError(code, message));
                };

                socket.once('end', () => {
                    reject(400, `Client connection closed before upgrade complete`);
                });

                socket.once('close', () => {
                    reject(400, `Client connection closed before upgrade complete`);
                });

                if (this._authCallback) {
                    await this._authCallback(
                        accept,
                        reject,
                        handshake,
                        signal
                    );
                } else {
                    accept();
                }

            } catch (err) {
                abortUpgrade(err);
            }
        };
    }

    /** @internal */
    async _onConnection(websocket, request) {
        try {
            if (this._state !== OPEN) {
                throw Error("Server is no longer open");
            }

            const {handshake, session} = this._pendingUpgrades.get(request);

            const client = new RPCServerClient({
                identity: handshake.identity,
                reconnect: false,
                callTimeoutMs: this._options.callTimeoutMs,
                pingIntervalMs: this._options.pingIntervalMs,
                deferPingsOnActivity: this._options.deferPingsOnActivity,
                respondWithDetailedErrors: this._options.respondWithDetailedErrors,
                callConcurrency: this._options.callConcurrency,
                strictMode: this._options.strictMode,
                strictModeValidators: this._options.strictModeValidators,
                maxBadMessages: this._options.maxBadMessages,
                protocols: this._options.protocols,
            }, {
                ws: websocket,
                session,
                handshake,
            });

            this._clients.add(client);
            client.once('close', () => this._clients.delete(client));
            this.emit('client', client);

        } catch (err) {
            websocket.close(err.statusCode || 1000, err.message);
        }
    }

    /**
     * Registers a callback that is invoked before each incoming client connection is accepted.
     *
     * The callback receives `(accept, reject, handshake, signal)` and must call either `accept()`
     * or `reject()` to resolve the handshake. See the {@link AuthCallback} typedef for the full
     * signature of each argument.
     *
     * Registering an auth callback is optional. When no callback is set, every client that
     * advertises a mutually-supported subprotocol is accepted automatically.
     *
     * @param {AuthCallback} cb - Function called for every incoming connection before it is accepted.
     * @example
     * // Validate HTTP Basic auth credentials, attach session data, and handle early disconnects
     * server.auth(async (accept, reject, handshake, signal) => {
     *     const username = handshake.identity;
     *     const password = handshake.password?.toString('utf8');
     *
     *     const user = await db.findUser(username, password); // async lookup
     *
     *     if (signal.aborted) return; // socket closed while we were waiting
     *
     *     if (user) {
     *         accept({ userId: user.id }); // session data accessible as client.session
     *     } else {
     *         reject(401, 'Unauthorized');
     *     }
     * });
     */
    auth(cb) {
        this._authCallback = cb;
    }

    /**
     * Creates a simple HTTP server which only accepts websocket upgrades and returns a 404
     * response to any other request.
     *
     * @param {number} [port] - The port number to listen on. If not set, the OS will assign an unused port.
     * @param {string} [host] - The host address to bind to. If not set, connections will be accepted on all interfaces.
     * @param {object} [options]
     * @param {AbortSignal} [options.signal] - An AbortSignal used to abort the listen() call.
     * @returns {Promise.<http.Server>} Resolves with the HTTP server instance
     */
    async listen(port, host, options = {}) {
        const ac = new AbortController();
        this._httpServerAbortControllers.add(ac);
        if (options.signal) {
            once(options.signal, 'abort').then(() => {
                ac.abort(options.signal.reason);
            });
        }
        const httpServer = createServer({
            noDelay: true,
        }, (req, res) => {
            res.setHeader('Server', getPackageIdent());
            res.statusCode = 404;
            res.end();
        });
        httpServer.on('upgrade', this.handleUpgrade);
        httpServer.once('close', () => this._httpServerAbortControllers.delete(ac));
        await new Promise((resolve, reject) => {
            httpServer.listen({
                port,
                host,
                signal: ac.signal,
            }, err => err ? reject(err) : resolve());
        });
        return httpServer;
    }

    /**
     * This blocks new clients from connecting, calls client.close() on all connected clients,
     * and then finally closes any listening HTTP servers which were created using listen().
     *
     * @param {object} [options]
     * @param {number} [options.code=1001] - The WebSocket close code to pass to all connected clients.
     * @param {string} [options.reason=''] - The reason for closure to pass to all connected clients.
     * @param {boolean} [options.awaitPending=false] - If true, each connected client won't be fully closed until any outstanding in-flight inbound and outbound calls are responded to. Additional calls will be rejected in the meantime.
     * @param {boolean} [options.force=false] - If true, terminates all client WebSocket connections instantly and uncleanly.
     * @returns {Promise<void>} Resolves when the server has completed closing.
     */
    async close({code, reason, awaitPending, force} = {}) {
        if (this._state === OPEN) {
            this._state = CLOSING;
            this.emit('closing');
            code = code ?? 1001;
            await Array.from(this._clients).map(cli => cli.close({code, reason, awaitPending, force}));
            await new Promise((resolve, reject) => {
                this._wss.close(err => err ? reject(err) : resolve());
                this._httpServerAbortControllers.forEach(ac => ac.abort("Closing"));
            });
            this._state = CLOSED;
            this.emit('close');
        }
    }
}
