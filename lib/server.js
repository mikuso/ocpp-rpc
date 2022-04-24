const {EventEmitter} = require('events');
const {WebSocketServer, OPEN, CLOSING, CLOSED} = require('ws');
const {createServer} = require('http');
const RPCServerClient = require('./server-client');
const EventBuffer = require('./event-buffer');
const { abortHandshake, parseSubprotocols } = require('./ws-util');

class RPCServer extends EventEmitter {
    constructor(options) {
        super();
        
        this.httpServerAbortControllers = new Set();
        this.options = Object.assign({
            // defaults
            wssOptions: {},
            protocols: null,
            callTimeoutMs: 1000*30,
            pingIntervalMs: 1000*30,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
        }, options || {});
        
        this.state = OPEN;
        this.clients = new Set();
        this.pendingUpgrades = new WeakMap();

        this.wss = new WebSocketServer({
            ...this.options.wssOptions,
            noServer: true,
            handleProtocols: (protocols, request) => {
                const {protocol} = this.pendingUpgrades.get(request);
                return protocol;
            },
        });

        this.wss.on('error', err => this.emit('error', err));
        this.wss.on('connection', this.onConnection.bind(this));
    }

    get handleUpgrade() {
        return async (request, socket, head) => {
            try {
                if (this.state !== OPEN) {
                    throw new Error("Server not open");
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
                    request,
                };
                
                let resolved = false;

                const accept = (session, protocol) => {
                    if (resolved) return;
                    resolved = true;

                    if (protocol === undefined) {
                        // pick first subprotocol
                        protocol = (this.options.protocols ?? []).find(p => protocols.has(p));
                    } else if (protocol !== false && !protocols.has(protocol)) {
                        return abortHandshake(socket, 406, "Client doesn't support expected subprotocol");
                    }

                    // cache auth results for connection creation
                    this.pendingUpgrades.set(request, {
                        session: session ?? {},
                        protocol,
                        handshake
                    });

                    this.wss.handleUpgrade(request, socket, head, ws => {
                        this.wss.emit('connection', ws, request);
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
                abortHandshake(socket, 400, this.options.respondWithDetailedErrors ? err.message : undefined);
            }
        };
    }

    async onConnection(websocket, request) {
        try {
            if (this.state !== OPEN) {
                throw Error("Server is no longer open");
            }

            const {handshake, session} = this.pendingUpgrades.get(request);

            const client = new RPCServerClient({
                reconnect: false,
                callTimeoutMs: this.options.callTimeoutMs,
                pingIntervalMs: this.options.pingIntervalMs,
                respondWithDetailedErrors: this.options.respondWithDetailedErrors,
                callConcurrency: this.options.callConcurrency,
            }, {
                ws: websocket,
                session,
                handshake,
                identity: handshake.identity,
            });

            this.clients.add(client);
            client.once('close', () => this.clients.delete(client));
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
        this.httpServerAbortControllers.add(ac);
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
        httpServer.once('close', () => this.httpServerAbortControllers.delete(ac));
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
        if (this.state === OPEN) {
            this.state = CLOSING;
            this.emit('closing');
            code = code ?? 1001;
            await Array.from(this.clients).map(cli => cli.close({code, reason, awaitPending, force}));
            await new Promise((resolve, reject) => {
                this.wss.close(err => err ? reject(err) : resolve());
                this.httpServerAbortControllers.forEach(ac => ac.abort("Closing"));
            });
            this.state = CLOSED;
            this.emit('close');
        }
    }
}

module.exports = RPCServer;