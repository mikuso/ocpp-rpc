const assert = require('assert/strict');
const http = require('http');
const { once } = require('events');
const RPCClient = require("../lib/client");
const { TimeoutError } = require('../lib/errors');
const RPCServer = require("../lib/server");
const { setTimeout } = require('timers/promises');
const {CLOSING, CLOSED, CONNECTING} = RPCClient;

describe('RPCClient', function(){
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

    describe('#connect', function(){

        it('should connect to an RPCServer', async () => {

            const {endpoint, close} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            await cli.connect();
            await cli.close();
            close();

        });

        it('should reject on non-websocket server', async () => {

            const httpServer = http.createServer((req, res) => {
                res.end();
            });
            const httpServerAbort = new AbortController();
            await new Promise((resolve, reject) => {
                httpServer.listen({
                    port: 0,
                    host: 'localhost',
                    signal: httpServerAbort.signal,
                }, err => err ? reject(err) : resolve());
            });
            const port = httpServer.address().port;
            
            const endpoint = `ws://localhost:${port}`;
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await assert.rejects(cli.connect());
            } finally {
                await cli.close();
                httpServerAbort.abort();
            }

        });

        it('should reject on non-ws endpoint URL', async () => {

            const {close, port} = await createServer();
            const cli = new RPCClient({
                endpoint: `http://localhost:${port}`,
                identity: 'X',
            });

            try {
                await assert.rejects(cli.connect());
            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject on missing identity', async () => {

            const {close, endpoint, port} = await createServer();
            const cli = new RPCClient({endpoint});

            try {
                await assert.rejects(cli.connect());
            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject on malformed endpoint URL', async () => {

            const {close} = await createServer();
            const cli = new RPCClient({
                endpoint: 'x',
                identity: 'X',
            });

            try {
                await assert.rejects(cli.connect());
            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject on unreachable address', async () => {

            const {close} = await createServer();
            const cli = new RPCClient({
                endpoint: 'ws://0.0.0.0:0',
                identity: 'X',
            });

            try {
                await assert.rejects(cli.connect());
            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject when no subprotocols match', async () => {

            const {endpoint, close} = await createServer({protocols: ['one', 'two']});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['three', 'four']
            });

            try {
                await assert.rejects(cli.connect());
            } finally {
                await cli.close();
                close();
            }

        });

        it('should select first matching subprotocol', async () => {

            const {endpoint, close} = await createServer({protocols: ['one', 'two', 'three', 'four', 'x']});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['test', 'three', 'four'],
            });

            try {
                await cli.connect();
                assert.equal(cli.protocol, 'three');
            } finally {
                await cli.close();
                close();
            }

        });

    });


    describe('#close', function() {

        it('should pass code and reason to server', async () => {

            const {server, endpoint, close} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                const serverClientPromise = once(server, 'client');
                await cli.connect();
                const [serverClient] = await serverClientPromise;
                const serverClosePromise = once(serverClient, 'close');
                await cli.close({code: 4001, reason: 'TEST'});
                const [serverClose] = await serverClosePromise;
                assert.equal(serverClose.code, 4001);
                assert.equal(serverClose.reason, 'TEST');

            } finally {
                close();
            }

        });

        it('should return the close code of the first close() call', async () => {

            const {endpoint, close} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                const p1 = cli.close({code: 4001, reason: 'FIRST'});
                const p2 = cli.close({code: 4002, reason: 'SECOND'});
                const [v1, v2] = await Promise.all([p1, p2]);
                assert.equal(v1.code, 4001);
                assert.equal(v1.reason, 'FIRST');
                assert.equal(v2.code, 4001);
                assert.equal(v2.reason, 'FIRST');
                const v3 = await cli.close({code: 4003, reason: 'THIRD'});
                assert.equal(v3.code, 4001);
                assert.equal(v3.reason, 'FIRST');

            } finally {
                close();
            }

        });

        it('should abort #connect if connection in progress, with code 1001', async () => {

            const {endpoint, close} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                const connPromise = cli.connect();
                const closePromise = cli.close({code: 4001}); // 4001 should be ignored
                const [connResult, closeResult] = await Promise.allSettled([connPromise, closePromise]);
                assert.equal(connResult.status, 'rejected');
                assert.equal(connResult.reason.name, 'AbortError');
                assert.equal(closeResult.status, 'fulfilled');
                assert.equal(closeResult.value?.code, 1001);
            } finally {
                close();
            }

        });

        it('should not throw if already closed', async () => {

            const {endpoint, close} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                await cli.close();
                await assert.doesNotReject(cli.close());
            } finally {
                close();
            }

        });

        it('should abort all outbound calls when {awaitPending: false}', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                const [callResult, closeResult] = await Promise.allSettled([
                    cli.call('Sleep', {ms: 100}),
                    cli.close({awaitPending: false})
                ]);
                assert.equal(callResult.status, 'rejected');
                assert.equal(closeResult.status, 'fulfilled');

            } finally {
                close();
            }

        });

        it('should abort all inbound calls when {awaitPending: false}', async () => {
            
            let serverInitiatedCall = null;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    serverInitiatedCall = client.call('Sleep', {ms: 50});
                }
            });
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                cli.handle('Sleep', async ({params, signal}) => {
                    await setTimeout(params.ms, null, {signal});
                });

                await cli.connect();
                
                const [callResult, closeResult] = await Promise.allSettled([
                    serverInitiatedCall,
                    cli.close({awaitPending: false})
                ]);
                assert.equal(callResult.status, 'rejected');
                assert.equal(closeResult.status, 'fulfilled');

            } finally {
                close();
            }

        });

        it('should wait for all outbound calls to settle when {awaitPending: true}', async () => {

            const {endpoint, close, server} = await createServer({respondWithDetailedErrors: true});
            const cli = new RPCClient({endpoint, identity: 'X', callConcurrency: 2});

            try {
                await cli.connect();
                const [rejectResult, sleepResult, closeResult] = await Promise.allSettled([
                    cli.call('Reject', {code: 'TEST'}),
                    cli.call('Sleep', {ms: 50}),
                    cli.close({awaitPending: true})
                ]);

                assert.equal(rejectResult.status, 'rejected');
                assert.equal(rejectResult.reason.details.code, 'TEST');
                assert.equal(sleepResult.status, 'fulfilled');
                assert.equal(closeResult.status, 'fulfilled');

            } finally {
                close();
            }

        });

        it('should wait for all inbound calls to settle when {awaitPending: true}', async () => {
            
            const echoVal = 'TEST123';
            let serverInitiatedCall = null;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    serverInitiatedCall = client.call('SlowEcho', {ms: 50, val: echoVal});
                }
            });
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                cli.handle('SlowEcho', async ({params}) => {
                    await setTimeout(params.ms);
                    return params.val;
                });

                await cli.connect();
                
                const [callResult, closeResult] = await Promise.allSettled([
                    serverInitiatedCall,
                    setTimeout(1).then(() => cli.close({awaitPending: true})),
                ]);
                
                assert.equal(callResult.status, 'fulfilled');
                assert.equal(callResult.value, echoVal);
                assert.equal(closeResult.status, 'fulfilled');

            } finally {
                close();
            }

        });

        it('should close immediately with code 1006 when {force: true}', async () => {
            
            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                cli.close({code: 4000, force: true});
                const [dc] = await once(cli, 'close');
                assert.equal(dc.code, 1006);

            } finally {
                close();
            }

        });

        it('should immediately reject any in-flight calls when {force: true}', async () => {
            
            let serverInitiatedCall = null;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    serverInitiatedCall = client.call('Sleep', {ms: 5000});
                }
            });
            const cli = new RPCClient({endpoint, identity: 'X'});
            cli.handle('Sleep', async ({params, signal}) => {
                await setTimeout(params.ms, null, {signal});
                return `Waited ${params.ms}ms`;
            });

            try {
                await cli.connect();

                const clientInitiatedCall = cli.call('Sleep', {ms: 5000});

                cli.close({code: 4000, force: true});
                const dcp = once(cli, 'close');

                await assert.rejects(clientInitiatedCall);
                await assert.rejects(serverInitiatedCall);
                
                const [dc] = await dcp;
                assert.equal(dc.code, 1006);
                

            } finally {
                close();
            }

        });

        it('should not reconnect even when {reconnect: true}', async () => {
            
            const {endpoint, close, server} = await createServer({
                protocols: ['a'],
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['a'],
                reconnect: true,
                maxReconnects: Infinity,
            });

            let connectCount = 0;
            cli.on('connecting', () => {
                connectCount++;
            });

            try {
                await cli.connect();
                const dc = await cli.close({code: 4000});
                assert.equal(dc.code, 4000);
                assert.equal(connectCount, 1);

            } finally {
                close();
            }

        });

    });


    describe('#call', function() {

        it('should timeout after client callTimeoutMs option', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callTimeoutMs: 20,
            });

            try {
                await cli.connect();
                await assert.rejects(cli.call('Sleep', {ms: 50}), TimeoutError);
            } finally {
                await cli.close();
                close();
            }

        });

        it('should not timeout after call callTimeoutMs option override', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callTimeoutMs: 50,
            });

            try {
                await cli.connect();
                await assert.doesNotReject(cli.call('Sleep', {ms: 50}, {callTimeoutMs: 100}));
            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject when state === CLOSING with {awaitPending: true}', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                const promSleep1 = cli.call('Sleep', {ms: 20});
                const promClose = cli.close({awaitPending: true});
                const promSleep2 = cli.call('Sleep', {ms: 1000});

                assert.equal(cli.state, CLOSING);

                await Promise.all([
                    assert.doesNotReject(promClose),
                    assert.doesNotReject(promSleep1),
                    assert.rejects(promSleep2),
                ]);

            } finally {
                close();
            }

        });

        it('should reject when state === CLOSING', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                cli.close();
                const callPromise = cli.call('Sleep', {ms: 1000});

                await assert.rejects(callPromise);
                assert.equal(cli.state, CLOSING);

            } finally {
                close();
            }

        });

        it('should reject when state === CLOSED', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                const callPromise = cli.call('Sleep', {ms: 1000});

                await assert.rejects(callPromise);
                assert.equal(cli.state, CLOSED);

            } finally {
                close();
            }

        });

        it('should queue when state === CONNECTING', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                cli.connect();
                const resPromise = cli.call('Echo', 'TEST');

                assert.equal(cli.state, CONNECTING);
                await assert.doesNotReject(resPromise);
                await assert.equal(await resPromise, 'TEST');

            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject when options.signal aborts', async () => {

            const reason = "TEST123";
            const {endpoint, close} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                await cli.connect();
                const ac = new AbortController();
                
                const callProm = cli.call('Sleep', {ms: 5000}, {signal: ac.signal});
                ac.abort(reason);
                await assert.rejects(callProm);
                const abortedReason = await callProm.catch(err => err);
                if (abortedReason.message !== '') {
                    // nodejs < 17.2.0 always sets AbortError message to ''
                    // because AbortController#abort(reason) did not exist at the time.
                    assert.equal(reason, abortedReason.message);
                }

            } finally {
                await cli.close();
                close();
            }

        });

        it('should send calls serially (one at a time)', async () => {

            let concurrentCalls = 0;
            let totalCalls = 0;
            let mostConcurrent = 0;

            const {endpoint, close} = await createServer({}, {
                withClient: client => {
                    client.handle('Conc', async () => {
                        totalCalls++;
                        concurrentCalls++;
                        mostConcurrent = Math.max(mostConcurrent, concurrentCalls);
                        await setTimeout(25);
                        concurrentCalls--;
                    });
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callConcurrency: 1,
            });

            try {
                await cli.connect();
                
                await Promise.all([
                    cli.call('Conc'),
                    cli.call('Conc'),
                ]);

                assert.equal(mostConcurrent, 1);
                assert.equal(totalCalls, 2);

            } finally {
                await cli.close();
                close();
            }

        });

        it('should send calls concurrently with option {callConcurrency}', async () => {

            let concurrentCalls = 0;
            let totalCalls = 0;
            let mostConcurrent = 0;

            const {endpoint, close} = await createServer({}, {
                withClient: client => {
                    client.handle('Conc', async () => {
                        totalCalls++;
                        concurrentCalls++;
                        mostConcurrent = Math.max(mostConcurrent, concurrentCalls);
                        await setTimeout(20);
                        concurrentCalls--;
                    });
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callConcurrency: 3,
            });

            try {
                await cli.connect();
                
                await Promise.all([
                    cli.call('Conc'),
                    cli.call('Conc'),
                    cli.call('Conc'),
                    cli.call('Conc'),
                    cli.call('Conc'),
                ]);

                assert.equal(mostConcurrent, 3);
                assert.equal(totalCalls, 5);

            } finally {
                await cli.close();
                close();
            }

        });

    });

    
    describe('#_handleDisconnect', function() {

        it('client should disconnect when server closes', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});

            await cli.connect();
            close({code: 4050});
            const [dc] = await once(cli, 'close');
            assert(dc.code, 4050);

        });

        it('should reject outbound call in-flight when connection drops', async () => {

            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    await client.close({code: 4001});
                }
            });
            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});

            try {
                const closePromise = once(cli, 'close');
                await cli.connect();
                await assert.rejects(cli.call('Sleep', {ms: 1000}));
                const [closeResult] = await closePromise;
                assert.equal(closeResult.code, 4001);
                
            } finally {
                await cli.close();
                close();
            }

        });

        it('should reconnect if using option {reconnect: true} without subprotocols', async () => {

            let disconnectedOnce = false;
            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    if (!disconnectedOnce) {
                        disconnectedOnce = true;
                        await client.close({code: 4010, reason: "Please reconnect"});
                    }
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: true,
                maxReconnects: 1,
                backoff: {
                    initialDelay: 1,
                    maxDelay: 2,
                }
            });
            
            try {
                await cli.connect();
                const test1 = cli.call('Sleep', {ms: 1000});
                const [dc1] = await once(cli, 'disconnect');

                assert.equal(dc1.code, 4010);
                await assert.rejects(test1);
                
                const test2 = await cli.call('Echo', 'TEST2');
                assert.equal(test2, 'TEST2');

            } finally {
                await cli.close();
                close();
            }

        });

        it('should reconnect if using option {reconnect: true} with subprotocols', async () => {

            let disconnectedOnce = false;
            const {endpoint, close, server} = await createServer({
                protocols: ['a'],
                protocolRequired: true,
            }, {
                withClient: async (client) => {
                    if (!disconnectedOnce) {
                        disconnectedOnce = true;
                        await client.close({code: 4010, reason: "Please reconnect"});
                    }
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: true,
                protocols: ['a'],
                maxReconnects: 1,
                backoff: {
                    initialDelay: 1,
                    maxDelay: 2,
                }
            });
            
            try {
                await cli.connect();
                const test1 = cli.call('Sleep', {ms: 1000});
                const [dc1] = await once(cli, 'disconnect');

                assert.equal(dc1.code, 4010);
                await assert.rejects(test1);
                
                const test2 = await cli.call('Echo', 'TEST2');
                assert.equal(test2, 'TEST2');

            } finally {
                await cli.close();
                close();
            }

        });

        it('should reconnect exactly {maxReconnects} times before giving up', async () => {

            const maxReconnects = 3;
            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: true,
                maxReconnects,
                backoff: {
                    initialDelay: 10,
                    maxDelay: 11,
                }
            });

            await cli.connect();

            let reconCount = 0;
            cli.on('connecting', () => reconCount++);
            close();

            await once(cli, 'close');
            assert.equal(reconCount, maxReconnects);

        });

        it('should use same subprotocol on reconnect even if server changes preferences', async () => {

            const server2 = new RPCServer({
                protocols: ['b', 'a'],
            });

            const {endpoint, close, server, port} = await createServer({
                protocols: ['a', 'b'],
            }, {withClient: client => {
                client.handle('Switcheroo', async () => {
                    await close();
                    server2.listen(port);
                });
            }});
            

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: true,
                protocols: ['a', 'b'],
                backoff: {
                    initialDelay: 10,
                    maxDelay: 11,
                }
            });

            try {

                await cli.connect();
                assert.equal(cli.protocol, 'a');
                const call1Prom = cli.call('Switcheroo');
                await assert.rejects(call1Prom);
                await once(cli, 'open');
                assert.equal(cli.protocol, 'a');

            } finally {
                await cli.close();
                server2.close();
            }

        });

        it('should fail if reconnect cannot use same subprotocol', async () => {

            const server2 = new RPCServer({
                protocols: ['b'],
            });

            const {endpoint, close, server, port} = await createServer({
                protocols: ['a', 'b'],
            }, {withClient: client => {
                client.handle('Switcheroo', async () => {
                    await close();
                    server2.listen(port);
                });
            }});
            

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: true,
                protocols: ['a', 'b'],
                backoff: {
                    initialDelay: 10,
                    maxDelay: 11,
                }
            });

            try {
                await cli.connect();
                const call1Prom = cli.call('Switcheroo');
                await assert.rejects(call1Prom);
                
                await once(cli, 'connecting');
                const [dc] = await once(cli, 'close');
                assert.equal(dc.code, 1001);

            } finally {
                server2.close();
            }

        });

        it('should close with code 1001 after failed reconnect', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: true,
                maxReconnects: 3,
                backoff: {
                    initialDelay: 10,
                    maxDelay: 11,
                }
            });

            let timesOpened= 0;
            let timesConnecting= 0;

            cli.on('open', () => timesOpened++);
            cli.on('connecting', () => timesConnecting++);

            await cli.connect();
            close({code: 4060});

            const [closed] = await once(cli, 'close');
            assert.equal(closed.code, 1001);
            assert.equal(timesOpened, 1);
            assert.equal(timesConnecting, 4); // original + 3 reconnects

        });

    });


    describe('#_onMessage', function() {

        it('should close connections with code 1002 when receiving malformed messages', async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    client.sendRaw('x');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callTimeoutMs: 50,
            });

            try {
                await cli.connect();
                const [closed] = await once(cli, 'close');
                assert.equal(closed.code, 1002);

            } finally {
                await cli.close();
                close();
            }

        });

    });


    describe('#handle', function() {

        it('should only start handling one tick after connection opened', async () => {
            
            const {endpoint, close, server} = await createServer({protocols: ['b', 'c']}, {
                withClient: client => {
                    client.call('Test', {val: 123});
                }
            });
            const cli = new RPCClient({endpoint, identity: 'X', protocols: ['a','b']});

            try {
                const res = await new Promise(async (resolve, reject) => {
                    cli.handle(({method}) => {
                        reject(Error("Wildcard handler called for method: "+method));
                    });

                    await cli.connect();
                    assert.equal(cli.protocol, 'b');
                    cli.handle('Test', resolve);
                });

                assert.equal(res.method, 'Test');
                assert.equal(res.params.val, 123);

            } finally {
                await cli.close();
                close();
            }

        });


        it('should not invoke handler if client closes fast', async () => {
            
            const {endpoint, close, server} = await createServer({protocols: ['b', 'c']}, {
                withClient: client => {
                    client.call('Test', {val: 123});
                }
            });
            const cli = new RPCClient({endpoint, identity: 'X', protocols: ['a','b']});

            try {
                const [dc] = await new Promise(async (resolve, reject) => {
                    cli.handle(({method}) => {
                        reject(Error("Wildcard handler called for method: "+method));
                    });

                    await cli.connect();
                    cli.close({code: 4050});

                    once(cli, 'close').then(resolve);
                });

                assert.equal(dc.code, 4050);

            } finally {
                await cli.close();
                close();
            }

        });

    });


    describe('#_keepAlive', function() {

        it('should ping at the chosen interval', async () => {
            
            const pingIntervalMs = 40;

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                pingIntervalMs,
            });

            try {
                await cli.connect();
                const start = Date.now();
                await once(cli, 'ping');
                const fin = Date.now() - start;
                const {code} = await cli.close({code: 4050});
                assert.ok(fin >= pingIntervalMs);
                assert.ok(fin <= pingIntervalMs * 2);
                assert.equal(code, 4050);

            } finally {
                close();
            }

        });

        it('should force close client if no pong between pings', async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    // a hack to prevent WebSocket from responding to pings
                    client._ws._receiver.removeAllListeners('ping');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: false,
                pingIntervalMs: 30, // should fail pretty quickly
            });

            try {

                await cli.connect();
                const [dc] = await once(cli, 'close');
                assert.equal(dc.code, 1006);

            } finally {
                close();
            }

        });

        it('should process pings normally after keepAlive forces a reconnect', async () => {
            
            let doneOnce = false;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    if (!doneOnce) {
                        doneOnce = true;
                        // a hack to prevent WebSocket from responding to pings
                        client._ws._receiver.removeAllListeners('ping');
                    }
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                pingIntervalMs: 25,
                reconnect: true,
                backoff: {
                    initialDelay: 1,
                    maxDelay: 2,
                }
            });

            try {

                await cli.connect();
                const [dc] = await once(cli, 'disconnect');
                assert.equal(dc.code, 1006);
                await once(cli, 'open');
                await once(cli, 'ping');

            } finally {
                await cli.close();
                close();
            }

        });

    });

});