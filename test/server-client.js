const assert = require('assert/strict');
const { once } = require('events');
const RPCClient = require("../lib/client");
const RPCServer = require("../lib/server");
const { setTimeout } = require('timers/promises');
const { createValidator } = require('../lib/validator');

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

    it('should inherit server options', async () => {

        const inheritableOptions = {
            callTimeoutMs: Math.floor(Math.random()*99999),
            pingIntervalMs: Math.floor(Math.random()*99999),
            deferPingsOnActivity: true,
            respondWithDetailedErrors: true,
            callConcurrency: Math.floor(Math.random()*99999),
            strictMode: true,
            strictModeValidators: [
                getEchoValidator(),
            ],
            maxBadMessages: Math.floor(Math.random()*99999),
        };

        const server = new RPCServer({
            protocols: ['echo1.0'],
            ...inheritableOptions
        });
        const httpServer = await server.listen(0);
        const port = httpServer.address().port;
        const endpoint = `ws://localhost:${port}`;

        const test = new Promise((resolve, reject) => {
            server.on('client', cli => {
                const optionKeys = Object.keys(inheritableOptions);
                for (const optionKey of optionKeys) {
                    const option = cli._options[optionKey];
                    if (option !== inheritableOptions[optionKey]) {
                        reject(Error(`RPCServerClient did not inherit option "${optionKey}" from RPCServer`));
                    }
                }
                resolve();
            });
        });
        
        const cli = new RPCClient({
            endpoint,
            identity: 'X',
            reconnect: false,
            deferPingsOnActivity: false,
            pingIntervalMs: 40
        });
        await cli.connect();
        await cli.close();
        await server.close();
        await test;
    });

});