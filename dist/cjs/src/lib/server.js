"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCServer = void 0;
const events_1 = require("events");
const ws_1 = require("ws");
const node_http_1 = require("node:http");
const server_client_1 = require("./server-client");
const ws_util_1 = require("./ws-util");
const standard_validators_1 = require("./standard-validators");
const util_1 = require("./util");
const errors_1 = require("./errors");
const baseclient_1 = require("./baseclient");
;
class RPCServer extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._httpServerAbortControllers = new Set();
        this._state = baseclient_1.StateEnum.OPEN;
        this._clients = new Set();
        this._pendingUpgrades = new WeakMap();
        this._options = {
            wssOptions: {},
            protocols: [],
            callTimeoutMs: 1000 * 30,
            pingIntervalMs: 1000 * 30,
            deferPingsOnActivity: false,
            respondWithDetailedErrors: false,
            callConcurrency: 1,
            maxBadMessages: Infinity,
            strictMode: false,
            strictModeValidators: [],
        };
        this.reconfigure(options || {});
        this._wss = new ws_1.WebSocketServer({
            ...this._options.wssOptions,
            noServer: true,
            handleProtocols: (protocols, request) => {
                var _a;
                const pendingUpgrade = this._pendingUpgrades.get(request);
                return (_a = pendingUpgrade === null || pendingUpgrade === void 0 ? void 0 : pendingUpgrade.protocol) !== null && _a !== void 0 ? _a : false;
            },
        });
        this._wss.on('headers', (headers) => headers.push(`Server: ${(0, util_1.getPackageIdent)()}`));
        this._wss.on('error', (err) => this.emit('error', err));
        this._wss.on('connection', this._onConnection.bind(this));
    }
    reconfigure(options) {
        var _a;
        const newOpts = Object.assign({}, this._options, options);
        if (newOpts.strictMode && !((_a = newOpts.protocols) === null || _a === void 0 ? void 0 : _a.length)) {
            throw Error(`strictMode requires at least one subprotocol`);
        }
        const strictValidators = [...standard_validators_1.default];
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
        }
        else if (newOpts.strictMode) {
            if (!newOpts.protocols) {
                throw Error(`To use strictMode, you must specify at least one subprotocol in options.protocols or pass a list of protocols to options.strictMode`);
            }
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
            var _a, _b, _c, _d, _e;
            let resolved = false;
            const ac = new AbortController();
            const { signal } = ac;
            const url = new URL((_a = request.url) !== null && _a !== void 0 ? _a : '/', 'http://localhost');
            const pathParts = url.pathname.split('/');
            const identity = decodeURIComponent(pathParts.pop());
            const abortUpgrade = (error) => {
                resolved = true;
                if (error && error instanceof errors_1.WebsocketUpgradeError) {
                    (0, ws_util_1.abortHandshake)(socket, error.code, error.message);
                }
                else {
                    (0, ws_util_1.abortHandshake)(socket, 500);
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
                if (this._state !== baseclient_1.StateEnum.OPEN) {
                    throw new errors_1.WebsocketUpgradeError(500, "Server not open");
                }
                if (socket.readyState !== 'open') {
                    throw new errors_1.WebsocketUpgradeError(400, `Client readyState = '${socket.readyState}'`);
                }
                const headers = request.headers;
                if (((_b = headers.upgrade) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== 'websocket') {
                    throw new errors_1.WebsocketUpgradeError(400, "Can only upgrade websocket upgrade requests");
                }
                const endpoint = pathParts.join('/');
                const remoteAddress = (_c = request.socket.remoteAddress) !== null && _c !== void 0 ? _c : '';
                const protocols = request.headers.hasOwnProperty('sec-websocket-protocol')
                    ? (0, ws_util_1.parseSubprotocols)((_d = request.headers['sec-websocket-protocol']) !== null && _d !== void 0 ? _d : '')
                    : new Set();
                let password;
                if (headers.authorization) {
                    try {
                        const b64up = (_e = headers.authorization.match(/^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/)) === null || _e === void 0 ? void 0 : _e[1];
                        if (!b64up)
                            throw Error("Auth b64 not found");
                        const userPassBuffer = Buffer.from(b64up, 'base64');
                        const clientIdentityUserBuffer = Buffer.from(identity + ':');
                        if (clientIdentityUserBuffer.compare(userPassBuffer, 0, clientIdentityUserBuffer.length) === 0) {
                            password = userPassBuffer.subarray(clientIdentityUserBuffer.length);
                        }
                    }
                    catch (err) {
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
                    var _a;
                    if (resolved)
                        return;
                    resolved = true;
                    try {
                        if (socket.readyState !== 'open') {
                            throw new errors_1.WebsocketUpgradeError(400, `Client readyState = '${socket.readyState}'`);
                        }
                        if (protocol == null) {
                            protocol = ((_a = this._options.protocols) !== null && _a !== void 0 ? _a : []).find(p => protocols.has(p));
                        }
                        else if (protocol != null && !protocols.has(protocol)) {
                            throw new errors_1.WebsocketUpgradeError(400, `Client doesn't support expected subprotocol`);
                        }
                        this._pendingUpgrades.set(request, {
                            session: session !== null && session !== void 0 ? session : {},
                            protocol,
                            handshake
                        });
                        this._wss.handleUpgrade(request, socket, head, (ws) => {
                            this._wss.emit('connection', ws, request);
                        });
                    }
                    catch (err) {
                        abortUpgrade(err);
                    }
                };
                const reject = (code = 404, message = 'Not found') => {
                    if (resolved)
                        return;
                    resolved = true;
                    abortUpgrade(new errors_1.WebsocketUpgradeError(code, message));
                };
                socket.once('end', () => {
                    reject(400, `Client connection closed before upgrade complete`);
                });
                socket.once('close', () => {
                    reject(400, `Client connection closed before upgrade complete`);
                });
                if (this._authCallback) {
                    await this._authCallback(accept, reject, handshake, signal);
                }
                else {
                    accept();
                }
            }
            catch (err) {
                abortUpgrade(err);
            }
        };
    }
    auth(cb) {
        this._authCallback = cb;
    }
    async listen(port, host, options = {}) {
        const ac = new AbortController();
        this._httpServerAbortControllers.add(ac);
        const signal = options.signal;
        if (signal) {
            (0, events_1.once)(signal, 'abort').then(() => {
                ac.abort(signal.reason);
            });
        }
        const httpServer = (0, node_http_1.createServer)({
            noDelay: true,
        }, (req, res) => {
            res.setHeader('Server', (0, util_1.getPackageIdent)());
            res.statusCode = 404;
            res.end();
        });
        httpServer.on('upgrade', this.handleUpgrade);
        httpServer.once('close', () => this._httpServerAbortControllers.delete(ac));
        httpServer.listen({
            port,
            host,
            signal: ac.signal,
        });
        const complete = await Promise.race([
            (0, events_1.once)(httpServer, 'listening', { signal: ac.signal }),
            (0, events_1.once)(httpServer, 'error', { signal: ac.signal }),
            (0, events_1.once)(ac.signal, 'abort')
        ]);
        if (complete instanceof Error) {
            throw complete;
        }
        return httpServer;
    }
    async close({ code, reason, awaitPending, force } = {}) {
        if (this._state === baseclient_1.StateEnum.OPEN) {
            this._state = baseclient_1.StateEnum.CLOSING;
            this.emit('closing');
            code = code !== null && code !== void 0 ? code : 1001;
            await Array.from(this._clients).map(cli => cli.close({ code, reason, awaitPending, force }));
            await new Promise((resolve, reject) => {
                this._wss.close((err) => err ? reject(err) : resolve());
                this._httpServerAbortControllers.forEach(ac => ac.abort("Closing"));
            });
            this._state = baseclient_1.StateEnum.CLOSED;
            this.emit('close');
        }
    }
    async _onConnection(websocket, request) {
        var _a;
        try {
            if (this._state !== baseclient_1.StateEnum.OPEN) {
                throw Error("Server is no longer open");
            }
            const pendingUpgrade = this._pendingUpgrades.get(request);
            if (!pendingUpgrade) {
                throw Error("Upgrade is not pending");
            }
            const { handshake, session } = pendingUpgrade;
            const client = new server_client_1.RPCServerClient({
                identity: handshake.identity,
                callTimeoutMs: this._options.callTimeoutMs,
                pingIntervalMs: this._options.pingIntervalMs,
                deferPingsOnActivity: this._options.deferPingsOnActivity,
                respondWithDetailedErrors: this._options.respondWithDetailedErrors,
                callConcurrency: this._options.callConcurrency,
                strictMode: this._options.strictMode,
                strictModeValidators: this._options.strictModeValidators,
                maxBadMessages: this._options.maxBadMessages,
                protocols: this._options.protocols,
                headers: request.headers,
                reconnect: false,
                endpoint: request.url,
            }, {
                ws: websocket,
                session,
                handshake,
            });
            this._clients.add(client);
            client.once('close', () => this._clients.delete(client));
            this.emit('client', client);
        }
        catch (err) {
            websocket.close((_a = err.statusCode) !== null && _a !== void 0 ? _a : 1000, err.message);
        }
    }
}
exports.RPCServer = RPCServer;
