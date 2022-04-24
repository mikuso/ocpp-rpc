const assert = require('assert/strict');
const http = require('http');
const { once } = require('events');
const RPCClient = require("../lib/client");
const { TimeoutError } = require('../lib/errors');
const RPCServer = require("../lib/server");
const { setTimeout } = require('timers/promises');
const {CLOSING, CLOSED, CONNECTING} = RPCClient;

describe('RPCServerClient', function(){
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

        it('should throw', async () => {

            let servCli;
            const {endpoint, close} = await createServer({}, {
                withClient: cli => {
                    servCli = cli;
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            await cli.connect();
            await assert.rejects(servCli.connect());

            await cli.close();
            await close();

        });

    });

});