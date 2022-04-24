const assert = require('assert/strict');
const http = require('http');
const { once } = require('events');
const RPCClient = require("../lib/client");
const { TimeoutError, UnexpectedHttpResponse } = require('../lib/errors');
const RPCServer = require("../lib/server");
const { setTimeout } = require('timers/promises');
const {CLOSING, CLOSED, CONNECTING} = RPCClient;

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

    });

    // abortsignal passed to listen
    // should regularly ping clients
    // non-websocket clients are rejected with 404 response

});