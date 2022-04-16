const {EventEmitter} = require('events');
const {WebSocketServer, CONNECTING, OPEN, CLOSING, CLOSED} = require('ws');
const {createServer} = require('http');
const RPCServerClient = require('./server-client');

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
        }, options || {});
        this.state = OPEN;

        // some boilerplate to handle upgrade events from a HTTP server
        this.handleUpgrade = (request, socket, head) => {
            this.wss.handleUpgrade(request, socket, head, ws => {
                this.wss.emit('connection', ws, request);
            });
        };

        this.wss = new WebSocketServer({
            ...this.options.wssOptions,
            noServer: true,
            clientTracking: true,
            handleProtocols: (protocols, request) => {
                if (this.options.protocols instanceof Function) {
                    return this.options.protocols(protocols, request);
                } else if (Array.isArray(this.options.protocols)) {
                    const matchingProto = this.options.protocols.find(sproto => protocols.has(sproto));
                    return matchingProto === undefined ? false : matchingProto;
                }
            },
        });

        this.wss.on('connection', this.onConnection.bind(this));
    }

    async onConnection(websocket, request) {
        try {
            if (this.state !== OPEN) {
                throw Error(`Server not open`);
            }

            const protocol = websocket.protocol;

            if (this.options.protocolRequired && this.options.protocols && !protocol) {
                throw Error(`Subprotocol required`);
            }

            const leadMsgBuffer = [];
            const addToMsgBuffer = msg => leadMsgBuffer.push(msg);
            websocket.on('message', addToMsgBuffer);

            let auth = true;
            if (this.authCallback) {

                const remoteAddress = request.socket.remoteAddress;
                const headers = request.headers;
                const url = new URL(request.url, 'http://localhost');

                auth = await this.authCallback({
                    remoteAddress,
                    headers,
                    protocol,
                    url,
                });
            }

            if (!auth) {
                throw Error(`Auth returned: ${auth}`);
            }

            websocket.off('message', addToMsgBuffer);
            const client = new RPCServerClient({
                reconnect: false,
                callTimeoutMs: this.options.callTimeoutMs,
                pingIntervalMs: this.options.pingIntervalMs,
            }, {ws: websocket, request, auth, leadMsgBuffer});

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

    async close({code, reason} = {}) {
        if (this.state === OPEN) {
            code = code ?? 1001;
            this.state = CLOSING;
            await new Promise((resolve, reject) => {
                this.wss.clients.forEach(cli => cli.close(code, reason));
                this.wss.close(err => err ? reject(err) : resolve());
                this.httpServerAbortControllers.forEach(ac => ac.abort("Closing"));
            });
            this.state = CLOSED;
        }
    }
}

module.exports = RPCServer;