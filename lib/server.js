const {EventEmitter} = require('events');
const {WebSocketServer, OPEN, CLOSING, CLOSED} = require('ws');
const {createServer} = require('http');
const RPCServerClient = require('./server-client');
const { MissingSubprotocolError } = require('./errors');
const EventBuffer = require('./event-buffer');

class RPCServer extends EventEmitter {
    constructor(options) {
        super();
        
        this.httpServerAbortControllers = new Set();
        this.options = Object.assign({
            // defaults
            wssOptions: {},
            protocols: null,
            protocolRequired: true,
            callTimeoutMs: 1000*30,
            pingIntervalMs: 1000*30,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
        }, options || {});
        
        this.state = OPEN;
        this.clients = new Set();


        this.wss = new WebSocketServer({
            ...this.options.wssOptions,
            noServer: true,
            handleProtocols: (protocols, request) => {
                if (this.options.protocols instanceof Function) {
                    return this.options.protocols(protocols, request);
                } else if (Array.isArray(this.options.protocols)) {
                    const matchingProto = this.options.protocols.find(sproto => protocols.has(sproto));
                    return matchingProto === undefined ? false : matchingProto;
                }
            },
        });

        this.wss.shouldHandle = request => {
            if (this.state !== OPEN) {
                return false;
            }

            const protocols = request.headers['sec-websocket-protocol'];
            
            if (this.options.protocolRequired && this.options.protocols && !protocols) {
                // subprotocol required
                return false;
            }

            return true;
        }

        this.wss.on('connection', this.onConnection.bind(this));
    }

    get handleUpgrade() {
        return (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, ws => {
                this.wss.emit('connection', ws, request);
            });
        };
    }

    async onConnection(websocket, request) {
        try {
            if (this.state !== OPEN) {
                throw Error(`Server not open`);
            }

            const protocol = websocket.protocol;

            if (this.options.protocolRequired && this.options.protocols && !protocol) {
                throw new MissingSubprotocolError("Subprotocol required");
            }

            const leadMsgBuffer = new EventBuffer(websocket, 'message');

            const url = new URL(request.url, 'http://localhost');
            const pathParts = url.pathname.split('/');
            const identity = decodeURIComponent(pathParts.pop());
            const endpoint = pathParts.join('/');

            let auth = true;
            if (this.authCallback) {

                const remoteAddress = request.socket.remoteAddress;
                const headers = request.headers;

                auth = await this.authCallback({
                    remoteAddress,
                    headers,
                    protocol,
                    endpoint,
                    identity,
                });
            }

            if (!auth) {
                throw Error(`Auth returned: ${auth}`);
            }

            const client = new RPCServerClient({
                reconnect: false,
                callTimeoutMs: this.options.callTimeoutMs,
                pingIntervalMs: this.options.pingIntervalMs,
                respondWithDetailedErrors: this.options.respondWithDetailedErrors,
                callConcurrency: this.options.callConcurrency,
            }, {ws: websocket, request, auth, identity, leadMsgBuffer});

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

    async listen(port, host) {
        const ac = new AbortController();
        this.httpServerAbortControllers.add(ac);
        const httpServer = createServer({
            noDelay: true,
        }, (req, res) => {
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
            code = code ?? 1001;
            await Array.from(this.clients).map(cli => cli.close({code, reason, awaitPending, force}));
            await new Promise((resolve, reject) => {
                this.wss.close(err => err ? reject(err) : resolve());
                this.httpServerAbortControllers.forEach(ac => ac.abort("Closing"));
            });
            this.state = CLOSED;
        }
    }
}

module.exports = RPCServer;