const {EventEmitter, once} = require('events');
const {WebSocketServer, OPEN, CLOSING, CLOSED} = require('ws');
const {createServer} = require('http');
const RPCServerClient = require('./server-client');
const { abortHandshake, parseSubprotocols } = require('./ws-util');
const standardValidators = require('./standard-validators');

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
            protocols: null,
            callTimeoutMs: 1000*30,
            pingIntervalMs: 1000*30,
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
            try {
                if (this._state !== OPEN) {
                    throw new Error("Server not open");
                }

                if (request.headers.upgrade.toLowerCase() !== 'websocket') {
                    throw Error("Can only upgrade websocket upgrade requests");
                }

                const remoteAddress = request.socket.remoteAddress;
                const headers = request.headers;
                const protocols = ('sec-websocket-protocol' in request.headers)
                    ? parseSubprotocols(request.headers['sec-websocket-protocol'])
                    : new Set();
                const url = new URL(request.url, 'http://localhost');
                const pathParts = url.pathname.split('/');
                const identity = decodeURIComponent(pathParts.pop());
                const endpoint = pathParts.join('/');

                const handshake = {
                    remoteAddress,
                    headers,
                    protocols,
                    endpoint,
                    identity,
                    query: url.searchParams,
                    request,
                };

                let resolved = false;

                const accept = (session, protocol) => {
                    if (resolved) return;
                    resolved = true;

                    if (protocol === undefined) {
                        // pick first subprotocol
                        protocol = (this._options.protocols ?? []).find(p => protocols.has(p));
                    } else if (protocol !== false && !protocols.has(protocol)) {
                        return abortHandshake(socket, 406, "Client doesn't support expected subprotocol");
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
                };

                const reject = (code, message) => {
                    if (resolved) return;
                    resolved = true;

                    abortHandshake(socket, code ?? 400, message ?? '');
                };

                if (this.authCallback) {
                    await this.authCallback(
                        accept,
                        reject,
                        handshake
                    );
                } else {
                    accept();
                }

            } catch (err) {
                abortHandshake(socket, 400, this._options.respondWithDetailedErrors ? err.message : undefined);
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
                respondWithDetailedErrors: this._options.respondWithDetailedErrors,
                callConcurrency: this._options.callConcurrency,
                strictMode: this._options.strictMode,
                strictModeValidators: this._options.strictModeValidators,
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