const assert = require('assert/strict');
const http = require('http');
const { once } = require('events');
const RPCClient = require("../lib/client");
const { TimeoutError, UnexpectedHttpResponse, WebsocketUpgradeError } = require('../lib/errors');
const RPCServer = require("../lib/server");
const { setTimeout } = require('timers/promises');
const { createValidator } = require('../lib/validator');
const { abortHandshake } = require('../lib/ws-util');

describe('RPCServer', function(){
    this.timeout(500);

    async function createServer(options = {}, extra = {}) {
        const server = new RPCServer(options);
        const httpServer = await server.listen(0);
        const port = httpServer.address().port;
        const endpoint = `ws://localhost:${port}`;
        const close = (...args) => server.close(...args);
        server.on('client', client => {
            client.handle('Echo', async ({params}) => {
                return params;
            });
            client.handle('Sleep', async ({params, signal}) => {
                await setTimeout(params.ms, null, {signal});
                return `Waited ${params.ms}ms`;
            });
            client.handle('Reject', async ({params}) => {
                const err = Error("Rejecting");
                Object.assign(err, params);
                throw err;
            });
            if (extra.withClient) {
                extra.withClient(client);
            }
        });
        return {server, httpServer, port, endpoint, close};
    }


    function getEchoValidator() {
        return createValidator('echo1.0', [
            {
                "$schema": "http://json-schema.org/draft-07/schema",
                "$id": "urn:Echo.req",
                "type": "object",
                "properties": {
                    "val": {
                        "type": "string"
                    }
                },
                "additionalProperties": false,
                "required": ["val"]
            },
            {
                "$schema": "http://json-schema.org/draft-07/schema",
                "$id": "urn:Echo.conf",
                "type": "object",
                "properties": {
                    "val": {
                        "type": "string"
                    }
                },
                "additionalProperties": false,
                "required": ["val"]
            }
        ]);
    }

    describe('#constructor', function(){

        it('should throw if strictMode = true and not all protocol schemas found', async () => {

            assert.throws(() => {
                new RPCServer({
                    protocols: ['ocpp1.6', 'echo1.0', 'other0.1'],
                    strictMode: true,
                });
            });

            assert.throws(() => {
                new RPCServer({
                    protocols: ['ocpp1.6', 'echo1.0', 'other0.1'],
                    strictMode: ['ocpp1.6', 'other0.1'],
                });
            });

            assert.throws(() => {
                // trying to use strict mode with no protocols specified
                new RPCServer({
                    protocols: [],
                    strictMode: true,
                });
            });

            assert.throws(() => {
                // trying to use strict mode with no protocols specified
                new RPCServer({
                    strictMode: true,
                });
            });

            assert.doesNotThrow(() => {
                new RPCServer({
                    protocols: ['ocpp1.6', 'echo1.0', 'other0.1'],
                    strictModeValidators: [getEchoValidator()],
                    strictMode: ['ocpp1.6', 'echo1.0'],
                });
            });

            assert.doesNotThrow(() => {
                new RPCServer({
                    protocols: ['ocpp1.6', 'echo1.0'],
                    strictModeValidators: [getEchoValidator()],
                    strictMode: true,
                });
            });

        });

    });

    describe('events', function(){

        it('should emit "client" when client connects', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                
                const clientProm = once(server, 'client');
                await cli.connect();
                const [client] = await clientProm;
                assert.equal(client.identity, 'X');

            } finally {
                await cli.close();
                close();
            }

        });

        it('should correctly decode the client identity', async () => {

            const identity = 'RPC/ /123';
            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity});

            try {
                
                const clientProm = once(server, 'client');
                await cli.connect();
                const [client] = await clientProm;
                assert.equal(client.identity, identity);

            } finally {
                await cli.close();
                close();
            }

        });

    });

    
    describe('#auth', function(){

        it("should refuse client with error 400 when subprotocol incorrectly forced", async () => {

            const {endpoint, close, server} = await createServer({protocols: ['a', 'b']});

            server.auth((accept, reject, handshake) => {
                accept({}, 'b');
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['a'],
            });

            try {

                const err = await cli.connect().catch(e=>e);
                assert.equal(err.code, 400);

            } finally {
                close();
            }

        });

        it("should not throw on double-accept", async () => {

            const {endpoint, close, server} = await createServer();

            let allOk;
            let waitOk = new Promise(r => {allOk = r;});

            server.auth((accept, reject, handshake) => {
                accept();
                accept();
                allOk();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X'
            });

            try {
                await cli.connect();
                await waitOk;
            } finally {
                await cli.close();
                close();
            }

        });

        it("should not throw on double-reject", async () => {

            const {endpoint, close, server} = await createServer();

            let allOk;
            let waitOk = new Promise(r => {allOk = r;});

            server.auth((accept, reject, handshake) => {
                reject();
                reject();
                allOk();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X'
            });

            try {
                await assert.rejects(cli.connect(), {code: 404});
                await waitOk;
            } finally {
                await cli.close();
                close();
            }

        });

        it("should not throw on reject-after-accept", async () => {

            const {endpoint, close, server} = await createServer();

            let allOk;
            let waitOk = new Promise(r => {allOk = r;});

            server.auth((accept, reject, handshake) => {
                accept();
                reject();
                allOk();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X'
            });

            try {
                await cli.connect();
                await waitOk;
            } finally {
                await cli.close();
                close();
            }

        });

        it("should not throw on accept-after-reject", async () => {

            const {endpoint, close, server} = await createServer();

            let allOk;
            let waitOk = new Promise(r => {allOk = r;});

            server.auth((accept, reject, handshake) => {
                reject();
                accept();
                allOk();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X'
            });

            try {
                await assert.rejects(cli.connect(), {code: 404});
                await waitOk;
            } finally {
                await cli.close();
                close();
            }

        });

        it('should pass identity and endpoint path to auth', async () => {

            const identity = 'RPC/ /123';
            const extraPath = '/extra/long/path';
            const {endpoint, close, server} = await createServer({protocols: ['a', 'b']});
            const cli = new RPCClient({
                endpoint: endpoint + extraPath,
                identity,
                protocols: ['a', 'b'],
            });

            try {
                
                let hs;
                server.auth((accept, reject, handshake) => {
                    hs = handshake;
                    accept();
                });

                const serverClientProm = once(server, 'client');
                await cli.connect();
                const [serverClient] = await serverClientProm;

                assert.equal(serverClient.identity, identity);
                assert.equal(hs.identity, identity);
                assert.equal(hs.endpoint, extraPath);
                assert.equal(serverClient.protocol, 'a');

                assert.equal(cli.protocol, serverClient.protocol);
                assert.equal(cli.identity, serverClient.identity);

            } finally {
                await cli.close();
                close();
            }

        });

        it('should correctly parse endpoints with double slashes and dots', async () => {

            const identity = 'XX';
            const {endpoint, close, server} = await createServer({});

            try {
                const endpointPaths = [
                    {append: '/ocpp', expect: '/ocpp'},
                    {append: '//', expect: '//'},
                    {append: '//ocpp', expect: '//ocpp'},
                    {append: '/ocpp/', expect: '/ocpp/'},
                    {append: '/', expect: '/'},
                    {append: '///', expect: '///'},
                    {append: '/../', expect: '/'},
                    {append: '//../', expect: '/'},
                    {append: '/ocpp/..', expect: '/'},
                    {append: '/ocpp/../', expect: '/'},
                    {append: '//ocpp/../', expect: '//'},
                    {append: '', expect: '/'},
                ];
                
                for (const endpointPath of endpointPaths) {
                    const fullEndpoint = endpoint + endpointPath.append;

                    let hs;
                    server.auth((accept, reject, handshake) => {
                        hs = handshake;
                        accept();
                    });

                    const cli = new RPCClient({
                        endpoint: fullEndpoint,
                        identity,
                    });

                    await cli.connect();
                    await cli.close({force: true});

                    assert.equal(hs.endpoint, endpointPath.expect);
                    assert.equal(hs.identity, identity);
                }

            } finally {
                close();
            }

        });

        it('should attach session properties to client', async () => {

            let serverClient;
            const extraPath = '/extra/path';
            const identity = 'X';
            const proto = 'a';
            const sessionData = {a: 123, b: {c: 456}};

            const {endpoint, close, server} = await createServer({protocols: ['x', 'b', proto]}, {
                withClient: client => {
                    serverClient = client;
                }
            });
            
            server.auth((accept, reject, handshake) => {
                accept(sessionData, proto);
            });

            const cli = new RPCClient({
                endpoint: endpoint + extraPath,
                identity,
                protocols: ['x', 'c', proto],
            });

            try {
                
                await cli.connect();
                assert.deepEqual(serverClient.session, sessionData);
                assert.equal(serverClient.protocol, proto);
                assert.equal(cli.protocol, proto);

            } finally {
                await cli.close();
                close();
            }

        });

        it('should disconnect client if auth failed', async () => {

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject) => {
                reject(500);
            });
            const cli = new RPCClient({endpoint, identity: 'X'});
    
            const err = await cli.connect().catch(e=>e);
            assert.ok(err instanceof UnexpectedHttpResponse);
            assert.equal(err.code, 500);

            close();

        });

        it("should disconnect client if server closes during auth", async () => {

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject) => {
                close();
                accept();
            });
            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});
    
            const closeProm = once(cli, 'close');
            await cli.connect();

            const [closed] = await closeProm;

            assert.equal(closed.code, 1000);
            assert.equal(closed.reason, 'Server is no longer open');

        });

        

        it('should recognise passwords with colons', async () => {
            
            const password = 'hun:ter:2';

            const {endpoint, close, server} = await createServer({}, {withClient: cli => {
                cli.handle('GetPassword', () => {
                    return cli.session.pwd;
                });
            }});

            server.auth((accept, reject, handshake) => {
                accept({pwd: handshake.password.toString('utf8')});
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                password,
            });

            try {
                await cli.connect();
                const pass = await cli.call('GetPassword');
                assert.equal(password, pass);

            } finally {
                cli.close();
                close();
            }
        });

        it('should not get confused with identities and passwords containing colons', async () => {
            
            const identity = 'a:colonified:ident';
            const password = 'a:colonified:p4ss';
            
            let recIdent;
            let recPass;

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject, handshake) => {
                recIdent = handshake.identity;
                recPass = handshake.password;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity,
                password,
            });

            try {
                await cli.connect();
                assert.equal(password, recPass.toString('utf8'));
                assert.equal(identity, recIdent);

            } finally {
                cli.close();
                close();
            }
        });

        it('should recognise empty passwords', async () => {
            
            const password = '';
            let recPass;

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject, handshake) => {
                recPass = handshake.password;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                password,
            });

            try {
                await cli.connect();
                assert.equal(password, recPass.toString('utf8'));

            } finally {
                cli.close();
                close();
            }
        });

        it('should provide undefined password if no authorization header sent', async () => {
            
            let recPass;

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject, handshake) => {
                recPass = handshake.password;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                assert.equal(undefined, recPass);

            } finally {
                cli.close();
                close();
            }
        });

        it('should provide undefined password when identity mismatches username', async () => {
            
            let recPass;

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject, handshake) => {
                recPass = handshake.password;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                headers: {
                    'authorization': 'Basic WjoxMjM=',
                }
            });

            try {
                await cli.connect();
                assert.equal(undefined, recPass);

            } finally {
                cli.close();
                close();
            }
        });

        it('should provide undefined password on bad authorization header', async () => {
            
            let recPass;

            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject, handshake) => {
                recPass = handshake.password;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                headers: {
                    'authorization': 'Basic ?',
                }
            });

            try {
                await cli.connect();
                assert.equal(undefined, recPass);

            } finally {
                cli.close();
                close();
            }
        });
        
        it('should recognise binary passwords', async () => {
            
            const password = Buffer.from([
                0,1,2,3,4,5,6,7,8,9,
                65,66,67,68,69,
                251,252,253,254,255,
            ]);

            const {endpoint, close, server} = await createServer({}, {withClient: cli => {
                cli.handle('GetPassword', () => {
                    return cli.session.pwd;
                });
            }});

            server.auth((accept, reject, handshake) => {
                accept({pwd: handshake.password.toString('hex')});
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                password,
            });

            try {
                await cli.connect();
                const pass = await cli.call('GetPassword');
                assert.equal(password.toString('hex'), pass);

            } finally {
                cli.close();
                close();
            }
        });

    });

    
    describe('#close', function(){

        it('should not allow new connections after close (before clients kicked)', async () => {

            let callReceived;
            const callReceivedPromise = new Promise(r => {callReceived = r;});

            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    client.handle('Test', async () => {
                        callReceived();
                        await setTimeout(50);
                        return 123;
                    });
                }
            });

            const cli1 = new RPCClient({
                endpoint,
                identity: '1',
                reconnect: false,
            });
            const cli2 = new RPCClient({
                endpoint,
                identity: '2',
            });

            try {
                
                await cli1.connect();
                const callP = cli1.call('Test');
                await callReceivedPromise;
                close({awaitPending: true});
                const [callResult, connResult] = await Promise.allSettled([
                    callP,
                    cli2.connect()
                ]);

                assert.equal(callResult.status, 'fulfilled');
                assert.equal(callResult.value, 123);
                assert.equal(connResult.status, 'rejected');
                assert.equal(connResult.reason.code, 'ECONNREFUSED');

            } finally {
                close();
            }

        });

    });
    
    describe('#listen', function(){

        it('should attach to an existing http server', async () => {

            const server = new RPCServer();
            server.on('client', client => {
                client.handle('Test', () => {
                    return 123;
                });
            });

            const httpServer = http.createServer({}, (req, res) => res.end());
            httpServer.on('upgrade', server.handleUpgrade);
            await new Promise((resolve, reject) => {
                httpServer.listen({port: 0}, err => err ? reject(err) : resolve());
            });

            const endpoint = 'ws://localhost:'+httpServer.address().port;

            const cli1 = new RPCClient({
                endpoint,
                identity: '1'
            });
            const cli2 = new RPCClient({
                endpoint,
                identity: '2'
            });

            await cli1.connect();
            httpServer.close();
            const [callResult, connResult] = await Promise.allSettled([
                cli1.call('Test'),
                cli2.connect(),
            ]);
            await cli1.close(); // httpServer.close() won't kick clients
            
            assert.equal(callResult.status, 'fulfilled');
            assert.equal(callResult.value, 123);
            assert.equal(connResult.status, 'rejected');
            assert.equal(connResult.reason.code, 'ECONNREFUSED');

        });

        it('should create multiple http servers with listen()', async () => {

            const server = new RPCServer();
            const s1 = await server.listen();
            const e1 = 'ws://localhost:'+s1.address().port;
            const s2 = await server.listen();
            const e2 = 'ws://localhost:'+s2.address().port;

            const cli1 = new RPCClient({endpoint: e1, identity: '1', reconnect: false});
            const cli2 = new RPCClient({endpoint: e2, identity: '2', reconnect: false});

            await cli1.connect();
            await cli2.connect();

            const droppedProm = Promise.all([
                once(cli1, 'close'),
                once(cli2, 'close'),
            ]);

            server.close({code: 4050});
            await droppedProm;

        });

        it('should abort with signal', async () => {

            const ac = new AbortController();
            const server = new RPCServer();
            const httpServer = await server.listen(undefined, undefined, {signal: ac.signal});
            const port = httpServer.address().port;
            const endpoint = 'ws://localhost:'+port;

            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});
            
            await cli.connect();
            const {code} = await cli.close({code: 4080});
            assert.equal(code, 4080);

            ac.abort();

            const err = await cli.connect().catch(e=>e);

            assert.equal(err.code, 'ECONNREFUSED');

            await server.close();
        });


        it('should automatically ping clients', async () => {
            
            const pingIntervalMs = 40;
            let pingResolve;
            let pingPromise = new Promise(r => {pingResolve = r;})

            const {endpoint, close, server} = await createServer({
                pingIntervalMs,
            }, {
                withClient: async (client) => {
                    const pingRes = await once(client, 'ping');
                    pingResolve(pingRes[0]);
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                const start = Date.now();
                await cli.connect();
                const ping = await pingPromise;
                const fin = Date.now() - start;
                
                assert.ok(fin >= pingIntervalMs);
                assert.ok(fin <= pingIntervalMs * 2);
                assert.ok(ping.rtt <= pingIntervalMs * 2);
                
            } finally {
                await cli.close();
                close();
            }
        });

        it('should reject non-websocket requests with a 404', async () => {
            
            const {port, close, server} = await createServer();

            try {
                
                const req = http.request('http://localhost:'+port);
                req.end();

                const [res] = await once(req, 'response');
                assert.equal(res.statusCode, 404);
                
            } catch (err) {
                console.log({err});
            } finally {
                close();
            }
        });

    });

    describe('#handleUpgrade', function() {

        it("should not throw if abortHandshake() called after socket already destroyed", async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            let completeAuth;
            let authCompleted = new Promise(r => {completeAuth = r;})

            server.auth(async (accept, reject, handshake) => {
                reject(400);
                abortHandshake(handshake.request.socket, 500);
                completeAuth();
            });

            try {
                const conn = cli.connect();
                await assert.rejects(conn, {message: "Bad Request"});
                await authCompleted;
                
            } finally {
                await cli.close();
                close();
            }

        });

        
        it("should abort handshake if server not open", async () => {

            const server = new RPCServer();
            
            let abortEvent;
            server.on('upgradeAborted', event => {
                abortEvent = event;
            });
            
            let authed = false;
            server.auth((accept) => {
                // shouldn't get this far
                authed = true;
                accept()
            });

            let onUpgrade;
            let upgradeProm = new Promise(r => {onUpgrade = r;});

            const httpServer = http.createServer({}, (req, res) => res.end());
            httpServer.on('upgrade', (...args) => onUpgrade(args));

            await new Promise((resolve, reject) => {
                httpServer.listen({port: 0}, err => err ? reject(err) : resolve());
            });

            const endpoint = 'ws://localhost:'+httpServer.address().port;

            const cli = new RPCClient({
                endpoint,
                identity: 'X'
            });

            cli.connect();
            const upgrade = await upgradeProm;
            await server.close();
            assert.doesNotReject(server.handleUpgrade(...upgrade));
            assert.equal(authed, false);
            assert.equal(abortEvent.error.code, 500);
            httpServer.close();
            
        });
        

        it("should abort handshake for non-websocket upgrades", async () => {

            const {endpoint, close, server} = await createServer();

            let abortEvent;
            server.on('upgradeAborted', event => {
                abortEvent = event;
            });

            let authed = false;
            server.auth((accept) => {
                // shouldn't get this far
                authed = true;
                accept()
            });

            try {

                const req = http.request(endpoint.replace(/^ws/,'http') + '/X', {
                    headers: {
                        connection: 'Upgrade',
                        upgrade: '_UNKNOWN_',
                        'user-agent': 'test/0',
                    }
                });
                req.end();

                const [res] = await once(req, 'response');

                assert.equal(res.statusCode, 400);
                assert.equal(authed, false);
                assert.ok(abortEvent.error instanceof WebsocketUpgradeError);
                assert.equal(abortEvent.request.headers['user-agent'], 'test/0');
                
            } finally {
                close();
            }

        });
        

        it("should emit upgradeAborted event on auth reject", async () => {

            const {endpoint, close, server} = await createServer();

            let abortEvent;
            server.on('upgradeAborted', event => {
                abortEvent = event;
            });

            server.auth((accept, reject) => {
                reject(499);
            });

            try {

                const cli = new RPCClient({
                    endpoint,
                    identity: 'X'
                });

                await assert.rejects(cli.connect());
                
                assert.ok(abortEvent.error instanceof WebsocketUpgradeError);
                assert.equal(abortEvent.error.code, 499);
                
            } finally {
                close();
            }

        });

        it("should abort auth on upgrade error", async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            let completeAuth;
            let authCompleted = new Promise(r => {completeAuth = r;})

            server.auth(async (accept, reject, handshake, signal) => {
                const abortProm = once(signal, 'abort');
                await cli.close({force: true, awaitPending: false});
                await abortProm;
                completeAuth();
            });

            try {
                const connErr = await cli.connect().catch(e=>e);
                await authCompleted;
                assert.ok(connErr instanceof Error);

            } finally {
                await cli.close();
                close();
            }

        });


    });

});