const {EventEmitter, once} = require('events');
const {WebSocketServer, OPEN, CLOSING, CLOSED} = require('ws');
const {createServer} = require('http');
const RPCServerClient = require('./server-client');
const { abortHandshake, parseSubprotocols } = require('./ws-util');
const standardValidators = require('./standard-validators');
const { getPackageIdent } = require('./util');
const { WebsocketUpgradeError } = require('./errors');

class RPCServer extends EventEmitter {
    constructor(options) {
        super();
        
        this._httpServerAbortControllers = new Set();
        this._state = OPEN;
        this._clients = new Set();
        this._pendingUpgrades = new WeakMap();

        this._options = {
            // defaults
            wssOptions: {},
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

    get handleUpgrade() {
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

                if (this.authCallback) {
                    await this.authCallback(
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

    auth(cb) {
        this.authCallback = cb;
    }

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

module.exports = RPCServer;