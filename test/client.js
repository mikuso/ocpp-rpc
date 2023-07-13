const assert = require('assert/strict');
const http = require('http');
const { once } = require('events');
const RPCClient = require("../lib/client");
const { TimeoutError, RPCFrameworkError, RPCError, RPCProtocolError, RPCTypeConstraintViolationError, RPCOccurenceConstraintViolationError, RPCPropertyConstraintViolationError, RPCOccurrenceConstraintViolationError, RPCFormationViolationError } = require('../lib/errors');
const RPCServer = require("../lib/server");
const { setTimeout } = require('timers/promises');
const { createValidator } = require('../lib/validator');
const { createRPCError } = require('../lib/util');
const { NOREPLY } = require('../lib/symbols');
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
            client.handle('Heartbeat', () => {
                return {currentTime: new Date().toISOString()};
            });
            client.handle('TestTenth', ({params}) => {
                return {val: params.val / 10};
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

    function getNumberTestValidator() {
        return createValidator('numbers1.0', [
            {
                "$schema": "http://json-schema.org/draft-07/schema",
                "$id": "urn:TestTenth.req",
                "type": "object",
                "properties": {
                    "val": {
                        "type": "number",
                        "multipleOf": 0.1
                    }
                },
                "additionalProperties": false,
                "required": ["val"]
            },
            {
                "$schema": "http://json-schema.org/draft-07/schema",
                "$id": "urn:TestTenth.conf",
                "type": "object",
                "properties": {
                    "val": {
                        "type": "number",
                        "multipleOf": 0.01
                    }
                },
                "additionalProperties": false,
                "required": ["val"]
            }
        ]);
    }

    describe('#constructor', function(){

        it('should throw on missing identity', async () => {

            assert.throws(() => {
                new RPCClient({
                    endpoint: 'ws://localhost',
                });
            });

        });

        it('should throw if strictMode = true and not all protocol schemas found', async () => {

            assert.throws(() => {
                new RPCClient({
                    endpoint: 'ws://localhost',
                    identity: 'x',
                    protocols: ['ocpp1.6', 'echo1.0', 'other0.1'],
                    strictMode: true,
                });
            });

            assert.throws(() => {
                new RPCClient({
                    endpoint: 'ws://localhost',
                    identity: 'x',
                    protocols: ['ocpp1.6', 'echo1.0', 'other0.1'],
                    strictMode: ['ocpp1.6', 'other0.1'],
                });
            });

            assert.throws(() => {
                // trying to use strict mode with no protocols specified
                new RPCClient({
                    endpoint: 'ws://localhost',
                    identity: 'x',
                    protocols: [],
                    strictMode: true,
                });
            });

            assert.throws(() => {
                // trying to use strict mode with no protocols specified
                new RPCClient({
                    endpoint: 'ws://localhost',
                    identity: 'x',
                    strictMode: true,
                });
            });

            assert.doesNotThrow(() => {
                new RPCClient({
                    endpoint: 'ws://localhost',
                    identity: 'x',
                    protocols: ['ocpp1.6', 'echo1.0', 'other0.1'],
                    strictModeValidators: [getEchoValidator()],
                    strictMode: ['ocpp1.6', 'echo1.0'],
                });
            });

            assert.doesNotThrow(() => {
                new RPCClient({
                    endpoint: 'ws://localhost',
                    identity: 'x',
                    protocols: ['ocpp1.6', 'echo1.0'],
                    strictModeValidators: [getEchoValidator()],
                    strictMode: true,
                });
            });

        });

    });

    describe('events', function(){

        it('should emit call and response events', async () => {

            const {endpoint, close} = await createServer({}, {
                withClient: cli => {
                    cli.call('Test').catch(()=>{});
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            const test = {
                in: {},
                out: {},
            };

            cli.on('call', call => {
                test[call.outbound?'out':'in'].call = call;
            });
            cli.on('response', response => {
                test[response.outbound?'out':'in'].response = response;
            });

            await cli.connect();
            await cli.call('Sleep', {ms: 25});
            await cli.close();
            await close();

            assert.ok(test.in.call);
            assert.ok(test.in.response);
            assert.ok(test.out.call);
            assert.ok(test.out.response);
            assert.equal(test.in.call.payload[1], test.out.response.payload[1]);
            assert.equal(test.out.call.payload[1], test.in.response.payload[1]);

        });

        it('should emit callResult and callError events for outbound calls', async () => {

            const {endpoint, close} = await createServer({}, {});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            let result;
            let error;

            cli.on('callResult', evt => {
                result = evt;
            });

            cli.on('callError', evt => {
                error = evt;
            });

            await cli.connect();
            await cli.call('Echo', {txt: 'Test'});
            await cli.call('Reject', {details:{code: 'Test'}}).catch(()=>{});
            await cli.close();
            await close();

            assert.equal(result.method, 'Echo');
            assert.equal(result.outbound, true);
            assert.equal(result.params.txt, 'Test');
            assert.equal(result.result.txt, 'Test');
            
            assert.equal(error.method, 'Reject');
            assert.equal(error.outbound, true);
            assert.equal(error.params.details.code, 'Test');
            assert.equal(error.error.details.code, 'Test');

        });

        it('should emit callResult and callError events for inbound calls', async () => {

            let resolveReceived;
            let received = new Promise(r => {resolveReceived = r});

            const {endpoint, close} = await createServer({}, {
                withClient: async (cli) => {
                    await cli.call('Echo', {txt: 'Test'});
                    await cli.call('Reject', {details:{code: 'Test'}}).catch(()=>{});
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            cli.handle('Echo', async ({params}) => {
                return params;
            });
    
            cli.handle('Reject', async ({params}) => {
                const err = Error("Rejecting");
                Object.assign(err, params);
                throw err;
            });

            let result;
            let error;

            cli.on('callResult', evt => {
                result = evt;
            });

            cli.on('callError', evt => {
                error = evt;
                resolveReceived();
            });

            await cli.connect();
            await received;
            await cli.close();
            await close();

            assert.equal(result.method, 'Echo');
            assert.equal(result.outbound, false);
            assert.equal(result.params.txt, 'Test');
            assert.equal(result.result.txt, 'Test');
            
            assert.equal(error.method, 'Reject');
            assert.equal(error.outbound, false);
            assert.equal(error.params.details.code, 'Test');
            assert.equal(error.error.details.code, 'Test');

        });

        it('should emit 2 message events after call', async () => {
            
            const {endpoint, close} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            const messages = [];
            await cli.connect();
            cli.on('message', m => messages.push({
                payload: JSON.parse(m.message.toString('utf8')),
                outbound: m.outbound,
            }));
            await cli.call('Echo', {val: 123});
            await cli.close();
            await close();

            const [call, res] = messages;
            assert.equal(call.outbound, true);
            assert.equal(res.outbound, false);
            assert.equal(call.payload[0], 2);
            assert.equal(res.payload[0], 3);
            assert.equal(call.payload[1], res.payload[1]);
            assert.equal(call.payload[2], 'Echo');

        });

        it('should emit 2 message events after handle', async () => {
            
            let complete;
            let done = new Promise(r=>{complete = r;});
            const {endpoint, close} = await createServer({}, {
                withClient: async (cli) => {
                    await cli.call('Echo', {val: 123});
                    cli.close();
                    complete();
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: false,
            });

            cli.handle('Echo', ({params}) => params);

            const messages = [];
            await cli.connect();
            cli.on('message', m => messages.push({
                payload: JSON.parse(m.message.toString('utf8')),
                outbound: m.outbound,
            }));

            await done;
            await close();

            const [call, res] = messages;
            assert.equal(call.outbound, false);
            assert.equal(res.outbound, true);
            assert.equal(call.payload[0], 2);
            assert.equal(res.payload[0], 3);
            assert.equal(call.payload[1], res.payload[1]);
            assert.equal(call.payload[2], 'Echo');

        });

        it("should emit 'badMessage' with 'RpcFrameworkError' when message is not a JSON structure", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('{]');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'RpcFrameworkError');
            } finally {
                await cli.close();
                close();
            }
        });

        it("should emit 'badMessage' with 'RpcFrameworkError' when message is not an array", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('{}');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'RpcFrameworkError');
            } finally {
                await cli.close();
                close();
            }
        });

        it("should emit 'badMessage' with 'RpcFrameworkError' when message type is not a number", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('["a", "123", "Echo", {}]');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'RpcFrameworkError');
            } finally {
                await cli.close();
                close();
            }
        });

        it("should emit 'badMessage' with 'MessageTypeNotSupported' when message type unrecognised", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('[0, "123", "Echo", {}]');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'MessageTypeNotSupported');
            } finally {
                await cli.close();
                close();
            }
        });

        it("should emit 'badMessage' with 'RpcFrameworkError' when message ID is not a string", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('[2, 123, "Echo", {}]');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'RpcFrameworkError');
            } finally {
                await cli.close();
                close();
            }
        });

        it("should emit 'badMessage' with 'RpcFrameworkError' when method is not a string", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('[2, "123", 123, {}]');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'RpcFrameworkError');
            } finally {
                await cli.close();
                close();
            }
        });

        it("should emit 'badMessage' with 'RpcFrameworkError' when message ID is repeated", async () => {
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {

                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                
                cli.sendRaw('[2, "123", "Sleep", {"ms":20}]');
                cli.sendRaw('[2, "123", "Sleep", {"ms":20}]');

                const [badMsg] = await once(cli, 'badMessage');
                assert.equal(badMsg.error.rpcErrorCode, 'RpcFrameworkError');
                assert.equal(badMsg.error.details.msgId, '123');
                assert.equal(badMsg.error.details.errorCode, 'RpcFrameworkError');
                assert.equal(badMsg.error.details.errorDescription, 'Already processing a call with message ID: 123');
            } finally {
                await cli.close();
                close();
            }
        });
    });

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

        it('should pass query string to server (as object)', async () => {
            
            let shake;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    client.handle('GetQuery', () => client.handshake.query.toString());
                }
            });
            server.auth((accept, reject, handshake) => {
                shake = handshake;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                query: {'x-test': 'abc', '?=': '123'},
            });

            try {
                await cli.connect();
                const query = new URLSearchParams(await cli.call('GetQuery'));
                assert.equal(query.get('x-test'), 'abc');
                assert.equal(shake.query.get('?='), '123');

            } finally {
                cli.close();
                close();
            }
        });

        it('should pass query string to server (as string)', async () => {
            
            let shake;
            const {endpoint, close, server} = await createServer();
            server.auth((accept, reject, handshake) => {
                shake = handshake;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                query: 'x-test=abc'
            });

            try {
                await cli.connect();
                assert.equal(shake.query.get('x-test'), 'abc');

            } finally {
                cli.close();
                close();
            }
        });

        it('should pass headers to server', async () => {
            
            let shake;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    client.handle('GetHeaders', () => client.handshake.headers);
                }
            });
            server.auth((accept, reject, handshake) => {
                shake = handshake;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                headers: {
                    'x-test': 'abc',
                    'x-test2': 'Token xxx',
                }
            });

            try {
                await cli.connect();
                const headers = await cli.call('GetHeaders');
                assert.equal(headers['x-test'], 'abc');
                assert.equal(shake.headers['x-test2'], 'Token xxx');

            } finally {
                cli.close();
                close();
            }
        });

        it('should also pass headers to server via wsOpts (but can be overridden by headers option)', async () => {
            
            let shake;
            const {endpoint, close, server} = await createServer({}, {
                withClient: client => {
                    client.handle('GetHeaders', () => client.handshake.headers);
                }
            });
            server.auth((accept, reject, handshake) => {
                shake = handshake;
                accept();
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                headers: {
                    'x-test': 'abc',
                    'x-test2': 'Token xxx',
                },
                wsOpts: {
                    headers: {
                        'x-test2': 'Token yyy',
                        'x-test3': 'Token zzz',
                    }
                }
            });

            try {
                await cli.connect();
                const headers = await cli.call('GetHeaders');
                assert.equal(headers['x-test'], 'abc');
                assert.equal(headers['x-test2'], 'Token xxx');
                assert.equal(headers['x-test3'], 'Token zzz');
                assert.equal(shake.headers['x-test'], 'abc');
                assert.equal(shake.headers['x-test2'], 'Token xxx');
                assert.equal(shake.headers['x-test3'], 'Token zzz');

            } finally {
                cli.close();
                close();
            }
        });

        it('should reject while closing', async () => {
            
            const {endpoint, close, server} = await createServer();

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();

                const [call, closed, connected] = await Promise.allSettled([
                    cli.call('Sleep', {ms: 30}),
                    cli.close({awaitPending: true}),
                    cli.connect(),
                ]);

                assert.equal(call.status, 'fulfilled');
                assert.equal(closed.status, 'fulfilled');
                assert.equal(connected.status, 'rejected');

            } finally {
                cli.close();
                close();
            }
        });

        it('should do nothing if already connected', async () => {
            
            const {endpoint, close, server} = await createServer();

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await assert.doesNotReject(cli.connect());
                await assert.doesNotReject(cli.connect());
            } finally {
                cli.close();
                close();
            }
        });

        it('should resolve to the same result when called simultaneously', async () => {
            
            const {endpoint, close, server} = await createServer();

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                const c1 = cli.connect();
                const c2 = cli.connect();

                await c1;
                await c2;

                assert.deepEqual(c1, c2);

            } finally {
                cli.close();
                close();
            }
        });

        it('should authenticate with string passwords', async () => {
            
            const password = 'hunter2';
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

        it('should authenticate with binary passwords', async () => {
            
            const password = Buffer.from([
                0,1,2,3,4,5,6,7,8,9,
                65,66,67,68,69,
                251,252,253,254,255,
            ]);
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
                // console.log(Buffer.from(recPass, 'ascii'));
                assert.equal(password.toString('hex'), recPass.toString('hex'));

            } finally {
                cli.close();
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

        it('should treat invalid/reserved close codes as 1000', async () => {

            const {server, endpoint, close} = await createServer();
            const cli = new RPCClient({endpoint, identity: 'X'});

            try {
                const testCodes = [-1000,0,1,1005,10000];

                for (const testCode of testCodes) {
                    const serverClientPromise = once(server, 'client');
                    await cli.connect();
                    const [serverClient] = await serverClientPromise;
                    const serverClosePromise = once(serverClient, 'close');
                    await cli.close({code: testCode});
                    const [serverClose] = await serverClosePromise;
                    assert.equal(serverClose.code, 1000);
                }

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

        it("should reject with 'RPCError' after invalid payload with client strictMode", async () => {
            
            const {endpoint, close, server} = await createServer({
                protocols: ['echo1.0']
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['echo1.0'],
                strictModeValidators: [getEchoValidator()],
                strictMode: true,
            });

            try {
                await cli.connect();

                const [c1, c2, c3] = await Promise.allSettled([
                    cli.call('Echo', {val: '123'}),
                    cli.call('Echo', {val: 123}),
                    cli.call('Unknown'),
                ]);

                assert.equal(c1.status, 'fulfilled');
                assert.equal(c1.value.val, '123');
                assert.equal(c2.status, 'rejected');
                assert.ok(c2.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c2.reason.rpcErrorCode, 'TypeConstraintViolation');
                assert.equal(c3.status, 'rejected');
                assert.ok(c3.reason instanceof RPCProtocolError);
                assert.equal(c3.reason.rpcErrorCode, 'ProtocolError');

            } finally {
                await cli.close();
                close();
            }

        });

        it("should reject with 'RPCError' after invalid payload with server strictMode", async () => {
            
            const {endpoint, close, server} = await createServer({
                protocols: ['ocpp1.6'],
                strictMode: true,
            }, {withClient: cli => {
                cli.handle(() => {});
            }});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['ocpp1.6'],
            });

            try {
                await cli.connect();

                const [c1, c2, c3] = await Promise.allSettled([
                    cli.call('UpdateFirmware', {}),
                    cli.call('Heartbeat', {a:123}),
                    cli.call('UpdateFirmware', {location: "a", retrieveDate: "a"}),
                ]);

                assert.equal(c1.status, 'rejected');
                assert.equal(c1.reason.rpcErrorCode, 'OccurrenceConstraintViolation');
                assert.ok(c1.reason instanceof RPCOccurrenceConstraintViolationError);
                assert.equal(c2.status, 'rejected');
                assert.equal(c2.reason.rpcErrorCode, 'PropertyConstraintViolation');
                assert.ok(c2.reason instanceof RPCPropertyConstraintViolationError);
                assert.equal(c3.status, 'rejected');
                assert.equal(c3.reason.rpcErrorCode, 'FormationViolation');
                assert.ok(c3.reason instanceof RPCFormationViolationError);

            } finally {
                await cli.close();
                close();
            }

        });

        
        it("should reject with 'RPCProtocolError' after invalid response with strictMode", async () => {
            const {endpoint, close, server} = await createServer({
                protocols: ['echo1.0']
            }, {withClient: cli => {
                cli.handle('Echo', async ({params}) => {
                    switch (params.val) {
                        case '1': return {bad: true};
                        case '2': return 123;
                        case '3': return [1,2,3];
                        case '4': return null;
                        case '5': return {val: params.val};
                    }
                });
            }});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['echo1.0'],
                strictModeValidators: [getEchoValidator()],
                strictMode: true,
            });

            try {
                await cli.connect();

                const [c1, c2, c3, c4, c5] = await Promise.allSettled([
                    cli.call('Echo', {val: '1'}),
                    cli.call('Echo', {val: '2'}),
                    cli.call('Echo', {val: '3'}),
                    cli.call('Echo', {val: '4'}),
                    cli.call('Echo', {val: '5'}),
                ]);

                assert.equal(c1.status, 'rejected');
                assert.ok(c1.reason instanceof RPCOccurenceConstraintViolationError);
                assert.equal(c2.status, 'rejected');
                assert.ok(c2.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c3.status, 'rejected');
                assert.ok(c3.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c4.status, 'rejected');
                assert.ok(c4.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c5.status, 'fulfilled');
                assert.equal(c5.value.val, '5');

            } finally {
                await cli.close();
                close();
            }
        });

        
        it("should emit 'strictValidationFailure' when incoming call is rejected by strictMode", async () => {
            
            const {endpoint, close, server} = await createServer({
                protocols: ['echo1.0']
            }, {withClient: async (cli) => {
                await cli.call('Echo', {bad: true}).catch(()=>{});
                await cli.call('Echo').catch(()=>{});
                await cli.call('Unknown').catch(()=>{});
            }});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['echo1.0'],
                strictModeValidators: [getEchoValidator()],
                strictMode: true,
            });

            try {
                let uks = 0;
                cli.handle('Echo', ({params}) => params);
                cli.handle('Unknown', () => ++uks);
                await cli.connect();

                let calls = 0;
                let responses = 0;

                cli.on('call', () => calls++);
                cli.on('response', () => responses++);

                const [c1] = await once(cli, 'strictValidationFailure');
                const [c2] = await once(cli, 'strictValidationFailure');
                const [c3] = await once(cli, 'strictValidationFailure');

                assert.equal(c1.error.rpcErrorCode, 'OccurenceConstraintViolation');
                assert.equal(c2.error.rpcErrorCode, 'TypeConstraintViolation');
                assert.equal(c3.error.rpcErrorCode, 'ProtocolError');

                assert.equal(calls, 3);
                assert.equal(responses, 3);
                assert.equal(uks, 0); // 'Unknown' handler should not be called


            } finally {
                await cli.close();
                close();
            }

        });

        
        it("should emit 'strictValidationFailure' when outgoing response is discarded by strictMode", async () => {
            const {endpoint, close, server} = await createServer({
                protocols: ['echo1.0']
            }, {withClient: cli => {
                cli.handle('Echo', async ({params}) => {
                    switch (params.val) {
                        case '1': return {bad: true};
                        case '2': return 123;
                        case '3': return [1,2,3];
                        case '4': return null;
                        case '5': return {val: params.val};
                    }
                });
            }});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['echo1.0'],
                strictModeValidators: [getEchoValidator()],
                strictMode: true,
            });

            try {
                await cli.connect();

                const [c1, c2, c3, c4, c5] = await Promise.allSettled([
                    cli.call('Echo', {val: '1'}),
                    cli.call('Echo', {val: '2'}),
                    cli.call('Echo', {val: '3'}),
                    cli.call('Echo', {val: '4'}),
                    cli.call('Echo', {val: '5'}),
                ]);

                assert.equal(c1.status, 'rejected');
                assert.ok(c1.reason instanceof RPCOccurenceConstraintViolationError);
                assert.equal(c2.status, 'rejected');
                assert.ok(c2.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c3.status, 'rejected');
                assert.ok(c3.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c4.status, 'rejected');
                assert.ok(c4.reason instanceof RPCTypeConstraintViolationError);
                assert.equal(c5.status, 'fulfilled');
                assert.equal(c5.value.val, '5');

            } finally {
                await cli.close();
                close();
            }
        });

        it("should not reject messages due to floating point imprecision in strictMode", async () => {

            const { endpoint, close, server } = await createServer({
                protocols: ['numbers1.0'],
            });

            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['numbers1.0'],
                strictModeValidators: [getNumberTestValidator()],
                strictMode: true,
            });

            try {
                await cli.connect();

                const [c1, c2, c3, c4, c5] = await Promise.allSettled([
                    cli.call('TestTenth', { val: 1 }),
                    cli.call('TestTenth', { val: 0.1 }),
                    cli.call('TestTenth', { val: 9.1 }),
                    cli.call('TestTenth', { val: 9.11 }),
                    cli.call('TestTenth', { val: 57.3 / 3 }),
                ]);

                assert.equal(c1.status, 'fulfilled');
                assert.equal(c1.value.val, 1/10);
                assert.equal(c2.status, 'fulfilled');
                assert.equal(c2.value.val, 0.1/10);
                assert.equal(c3.status, 'fulfilled');
                assert.equal(c3.value.val, 9.1/10);
                assert.equal(c4.status, 'rejected');
                assert.ok(c4.reason instanceof RPCOccurenceConstraintViolationError);
                assert.equal(c4.reason.details.errors[0].keyword, 'multipleOf');
                assert.equal(c5.status, 'fulfilled');
                assert.equal(c5.value.val, 57.3/3/10);

            } finally {
                await cli.close();
                close();
            }

        });

        it("should validate calls using in-built validators", async () => {

            const {endpoint, close, server} = await createServer({
                protocols: ['ocpp1.6'],
                strictMode: true,
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['ocpp1.6'],
                strictMode: true,
            });

            try {
                await cli.connect();

                const [c1, c2, c3] = await Promise.allSettled([
                    cli.call('Heartbeat', {}),
                    cli.call('Heartbeat', {a:1}),
                    cli.call('Heartbeat', 1),
                ]);
                
                assert.equal(c1.status, 'fulfilled');
                assert.ok('currentTime' in c1.value);
                assert.equal(c2.status, 'rejected');
                assert.ok(c2.reason instanceof RPCPropertyConstraintViolationError);
                assert.equal(c3.status, 'rejected');
                assert.ok(c3.reason instanceof RPCTypeConstraintViolationError);

            } finally {
                await cli.close();
                close();
            }

        });

        it("should reject call validation failure with FormationViolation on ocpp1.6", async () => {
            
            const {endpoint, close, server} = await createServer({
                protocols: ['ocpp1.6'],
                strictMode: true,
            }, {withClient: cli => {
                cli.handle('Heartbeat', () => {
                    throw createRPCError("FormatViolation");
                });
            }});
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                protocols: ['ocpp1.6'],
                strictMode: true,
            });

            try {
                await cli.connect();

                const [c1] = await Promise.allSettled([
                    cli.call('Heartbeat', {}),
                ]);
                
                assert.equal(c1.status, 'rejected');
                assert.equal(c1.reason.rpcErrorCode, 'FormationViolation');

            } finally {
                await cli.close();
                close();
            }

        });

        it('should reject when method is not a string', async () => {

            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();

                await assert.rejects(cli.call(1));
                await assert.rejects(cli.call([]));
                await assert.rejects(cli.call({}));

                const err = await cli.call(1).catch(e=>e);
                assert.ok(err instanceof RPCFrameworkError);

            } finally {
                await cli.close();
                close();
            }

        });

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

        it('should emit badMessage upon a response to a noReply call', async () => {

            const echoPayload = {abc: 123};
            const {endpoint, close} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                
                const res = await cli.call('Echo', echoPayload, {noReply: true});
                const [bad] = await once(cli, 'badMessage');
                
                const [mType, mId, mVal] = JSON.parse(bad.buffer.toString('utf8'));

                assert.equal(mType, 3);
                assert.deepEqual(mVal, echoPayload);
                assert.equal(res, undefined);

            } finally {
                await cli.close();
                close();
            }

        });

        it('should not reject when making unhandled noReply call', async () => {

            const {endpoint, close} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                
                const res = await cli.call('UnrecognisedMethod', 1, {noReply: true});
                assert.equal(res, undefined);

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
            assert.equal(dc.code, 4050);

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

        it('should close connections with code 1002 when receiving too many malformed messages', async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    client.sendRaw('x');
                    client.sendRaw('x');
                    client.sendRaw('x');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callTimeoutMs: 50,
                maxBadMessages: 2,
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

        it('should tolerate bad messages within the configured limits', async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    client.sendRaw('x');
                    client.sendRaw('x');
                    client.call('Ok');
                    client.sendRaw('x');
                    client.sendRaw('x');
                    client.call('Done');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                callTimeoutMs: 50,
                maxBadMessages: 2,
            });

            try {
                let resolve;
                let prom = new Promise(r => {resolve = r;});

                cli.handle('Ok', () => {});
                cli.handle('Done', resolve);
                await cli.connect();
                await prom;
                cli.close({code: 4060});
                const [closed] = await once(cli, 'close');
                assert.equal(closed.code, 4060);

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

        
        it('should not respond to a call that returns NOREPLY symbol', async () => {

            const {endpoint, close} = await createServer({}, {
                withClient: cli => {
                    cli.handle('NoReply', ({reply}) => {
                        reply(NOREPLY);
                    });
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                
                await assert.rejects(cli.call('NoReply', 123, {callTimeoutMs: 50}), TimeoutError);

            } finally {
                await cli.close();
                close();
            }

        });

        
        it('should report the message ID', async () => {

            const {endpoint, close} = await createServer({}, {
                withClient: cli => {
                    cli.handle('Manual', async ({messageId}) => {
                        await cli.sendRaw(JSON.stringify([
                            3,
                            messageId,
                            {messageId}
                        ]));
                        return NOREPLY;
                    });
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                
                const callOutProm = once(cli, 'call');
                const {messageId} = await cli.call('Manual');
                const [callOut] = await callOutProm;
                
                assert.equal(callOut.outbound, true);
                assert.equal(callOut.payload[0], 2);
                assert.equal(callOut.payload[1], messageId);
                assert.equal(callOut.payload[2], 'Manual');

            } finally {
                await cli.close();
                close();
            }

        });

        
        it('can reply early before return/throw', async () => {

            const {endpoint, close} = await createServer({}, {
                withClient: cli => {
                    cli.handle('ResolveEarly', async ({reply}) => {
                        reply("early");
                        return "late";
                    });
                    cli.handle('ResolveBeforeThrow', async ({reply}) => {
                        reply("early");
                        throw Error("late");
                    });
                    cli.handle('RejectEarly', async ({reply}) => {
                        reply(Error("early"));
                        throw Error("late");
                    });
                    cli.handle('RejectBeforeReturn', async ({reply}) => {
                        reply(Error("early"));
                        return "late";
                    });
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();

                assert.equal(await cli.call('ResolveEarly'), "early");
                const err = await cli.call('RejectEarly').catch(e=>e);
                assert.equal(err.message, "early");
                await assert.rejects(cli.call('RejectBeforeReturn'));
                assert.equal(await cli.call("ResolveBeforeThrow"), "early");

            } finally {
                await cli.close();
                close();
            }

        });

    });


    describe('#removeHandler', function() {

        it('should prevent wildcard handler from running again', async () => {
            
            let runs = 0;
            const {endpoint, close, server} = await createServer({}, {withClient: cli => {
                cli.handle(({method, params}) => {
                    runs++;
                    cli.removeHandler();
                    return method;
                });
            }});

            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});

            try {
                await cli.connect();

                const res = await Promise.allSettled([
                    cli.call('Any1'),
                    cli.call('Any2'),
                    cli.call('Any3'),
                ]);

                assert.equal(runs, 1);
                assert.equal(res[0].value, 'Any1');
                assert.equal(res[1].reason.rpcErrorCode, 'NotImplemented');
                assert.equal(res[2].reason.rpcErrorCode, 'NotImplemented');
                
            } finally {
                await cli.close();
                close();
            }

        });

        it('should prevent handled methods from running again', async () => {

            let runs = 0;
            const {endpoint, close, server} = await createServer({}, {withClient: cli => {
                cli.handle('Test', ({method, params}) => {
                    runs++;
                    cli.removeHandler('Test');
                    return runs;
                });
            }});

            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});

            try {
                await cli.connect();

                const res = await Promise.allSettled([
                    cli.call('Test'),
                    cli.call('Test'),
                    cli.call('Echo', 'TEST'),
                ]);

                assert.equal(runs, 1);
                assert.equal(res[0].value, 1);
                assert.equal(res[1].reason.rpcErrorCode, 'NotImplemented');
                assert.equal(res[2].value, 'TEST');
                
            } finally {
                await cli.close();
                close();
            }

        });

    });

    describe('#removeAllHandlers', function() {

        it('should prevent all handled methods from running again', async () => {

            let runs = 0;
            const {endpoint, close, server} = await createServer({}, {withClient: cli => {
                cli.handle('Test', ({method, params}) => {
                    runs++;
                    cli.removeAllHandlers();
                    return runs;
                });

                cli.handle(({method, params}) => {
                    throw Error('GenericError');
                });
            }});

            const cli = new RPCClient({endpoint, identity: 'X', reconnect: false});

            try {
                await cli.connect();

                const res = await Promise.allSettled([
                    cli.call('Test'),
                    cli.call('Test'),
                    cli.call('Echo', 'TEST'),
                    cli.call('Unknown'),
                ]);

                assert.equal(runs, 1);
                assert.equal(res[0].value, 1);
                assert.equal(res[1].reason.rpcErrorCode, 'NotImplemented');
                assert.equal(res[2].reason.rpcErrorCode, 'NotImplemented');
                assert.equal(res[3].reason.rpcErrorCode, 'NotImplemented');
                
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


        it('should not auto-ping server if other activity received with option deferPingsOnActivity', async () => {
            
            let pings = 0;
            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    // send some rapid activity from the server
                    for (let i = 0; i < 4; i++) {
                        await setTimeout(25);
                        await client.call('Echo', {});
                    }
                    await client.close();
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: false,
                deferPingsOnActivity: true,
                pingIntervalMs: 50
            });
            cli.handle('Echo', async ({params}) => {
                return params;
            });

            // count how many times we ping the server
            cli.on('ping', () => {++pings;});

            try {
                await cli.connect();
                await once(cli, 'close');
                // we shouldn't have pinged, because of the activity sent from the server
                assert.equal(pings, 0);
            } finally {
                await cli.close();
                close();
            }
        });

        it('should auto-ping server even if other activity received without option deferPingsOnActivity', async () => {
            
            let pings = 0;
            const {endpoint, close, server} = await createServer({}, {
                withClient: async (client) => {
                    // send some rapid activity from the server
                    for (let i = 0; i < 4; i++) {
                        await setTimeout(25);
                        await client.call('Echo', {});
                    }
                    await client.close();
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: false,
                deferPingsOnActivity: false,
                pingIntervalMs: 50
            });
            cli.handle('Echo', async ({params}) => {
                return params;
            });

            // count how many times we ping the server
            cli.on('ping', () => {++pings;});

            try {
                await cli.connect();
                await once(cli, 'close');
                // we should have pinged multiple times, despite the activity sent from the server
                assert.ok(pings > 0);
            } finally {
                await cli.close();
                close();
            }
        });


        it('should not auto-ping server if ping received with option deferPingsOnActivity', async () => {
            
            let pings = 0;
            const {endpoint, close, server} = await createServer({
                pingIntervalMs: 25,
                deferPingsOnActivity: false,
            }, {
                withClient: async (client) => {
                    // keep the client lingering long enough for the server to send several pings
                    await setTimeout(110);
                    await client.close();
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: false,
                deferPingsOnActivity: true,
                pingIntervalMs: 50
            });

            // count how many times we ping the server
            cli.on('ping', () => {++pings;});

            try {
                await cli.connect();
                await once(cli, 'close');
                // we shouldn't have pinged, because of the activity sent from the server
                assert.equal(pings, 0);
            } finally {
                await cli.close();
                close();
            }
        });

        it('should auto-ping server even if ping received without option deferPingsOnActivity', async () => {
            
            let pings = 0;
            const {endpoint, close, server} = await createServer({
                pingIntervalMs: 25,
                deferPingsOnActivity: false,
            }, {
                withClient: async (client) => {
                    // keep the client lingering long enough for the server to send several pings
                    await setTimeout(110);
                    await client.close();
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                reconnect: false,
                deferPingsOnActivity: false,
                pingIntervalMs: 50
            });

            // count how many times we ping the server
            cli.on('ping', () => {++pings;});

            try {
                await cli.connect();
                await once(cli, 'close');
                // we should have pinged multiple times, despite the activity sent from the server
                assert.ok(pings > 0);
            } finally {
                await cli.close();
                close();
            }
        });

    });


    describe('#sendRaw', function() {

        it("should cause a 'badMessage' event when used incorrectly", async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.sendRaw('x');
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                const badProm = once(cli, 'badMessage');
                await cli.connect();
                const [bad] = await badProm;
                assert.equal(bad.buffer.toString('utf8'), 'x');
                assert.equal(bad.error.rpcErrorCode, 'RpcFrameworkError');
                assert.equal(bad.response[0], 4);
                assert.equal(bad.response[1], '-1');
                assert.equal(bad.response[2], 'RpcFrameworkError');
                
            } finally {
                await cli.close();
                close();
            }

        });

    });

    describe('#reconfigure', function() {

        it("should not change identity on reconnect", async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.handle('Drop', () => cli.close());
                    cli.handle('GetID', () => cli.identity);
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                backoff: {
                    initialDelay: 1,
                    maxDelay: 2,
                }
            });

            try {
                await cli.connect();
                assert.equal(await cli.call('GetID'), 'X');

                cli.reconfigure({identity: 'Y'});
                await cli.call('Drop').catch(()=>{});
                
                assert.equal(await cli.call('GetID'), 'X');

            } finally {
                await cli.close();
                close();
            }

        });

        it("should change identity on explicit close and connect", async () => {

            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.handle('Drop', () => cli.close());
                    cli.handle('GetID', () => cli.identity);
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            try {
                await cli.connect();
                assert.equal(await cli.call('GetID'), 'X');

                cli.reconfigure({identity: 'Y'});
                await cli.close();
                await cli.connect();
                
                assert.equal(await cli.call('GetID'), 'Y');

            } finally {
                await cli.close();
                close();
            }

        });

        it("should be able to adjust queue concurrency", async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    let processing = 0;
                    cli.handle('Max', async () => {
                        ++processing;
                        await setTimeout(10);
                        return processing--;
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
                
                const arr = [1,2,3,4,5,6];

                const cc1 = await Promise.all(arr.map(x => cli.call('Max')));
                cli.reconfigure({callConcurrency: 3});
                const cc3 = await Promise.all(arr.map(x => cli.call('Max')));

                assert.equal(Math.max(...cc1), 1);
                assert.equal(Math.max(...cc3), 3);

            } finally {
                await cli.close();
                close();
            }

        });

        it("should be able to adjust backoff configuration", async () => {
            
            const {endpoint, close, server} = await createServer({}, {
                withClient: cli => {
                    cli.handle('Drop', () => cli.close());
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                backoff: {
                    initialDelay: 1,
                    maxDelay: 2,
                }
            });

            try {
                await cli.connect();

                await cli.call('Drop').catch(() => {});
                const t1 = Date.now();
                await once(cli, 'open');
                const r1 = Date.now() - t1;

                cli.reconfigure({
                    backoff: {
                        initialDelay: 30,
                        maxDelay: 31,
                    }
                });

                await cli.call('Drop').catch(() => {});
                const t2 = Date.now();
                await once(cli, 'open');
                const r2 = Date.now() - t2;
                
                assert.ok(r1 < 20);
                assert.ok(r2 > 20);

            } finally {
                await cli.close();
                close();
            }

        });

        it("should be able to adjust ping interval", async () => {
            
            const {endpoint, close, server} = await createServer();
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
                pingIntervalMs: 30,
            });

            try {
                
                await cli.connect();

                const t1 = Date.now();
                await once(cli, 'ping');
                const r1 = Date.now() - t1;
                
                cli.reconfigure({pingIntervalMs: 10});

                const t2 = Date.now();
                await once(cli, 'ping');
                const r2 = Date.now() - t2;

                assert.ok(r1 > 20);
                assert.ok(r2 < 20);

            } finally {
                await cli.close();
                close();
            }

        });

    });

});

