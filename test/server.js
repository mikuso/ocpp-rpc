const assert = require('assert/strict');
const http = require('http');
const { once } = require('events');
const RPCClient = require("../lib/client");
const { TimeoutError } = require('../lib/errors');
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
                
                let authParams;
                server.auth(params => {
                    authParams = params;
                    return true;
                });

                const clientProm = once(server, 'client');
                await cli.connect();
                const [client] = await clientProm;
                assert.equal(client.identity, identity);
                assert.equal(authParams.identity, identity);
                assert.equal(authParams.endpoint, extraPath);
                assert.equal(authParams.protocol, 'a');

            } finally {
                await cli.close();
                close();
            }

        });

    });

    // 
    // should close connections when receiving malformed messages
    // should not allow new connections after close (before http close)
    // should attach to an existing http server
    // should allow creating multiple http servers via listen() and close() only affects those closed?
    // should attach auth and request properties to client
    // should disconnect client if auth failed
    // should regularly ping clients
    // should disconnect client with code 1002 if protocol required but not provided

});