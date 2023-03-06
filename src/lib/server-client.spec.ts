import * as assert from 'assert/strict';
import {RPCClient} from "./client";
import {RPCServer, RPCServerOptions, ServerCloseOptions} from "./server";
import { setTimeout } from 'timers/promises';
import { createValidator } from './validator';
import { AddressInfo } from 'net';
import { RPCServerClient } from './server-client';

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

    async function createServer(options: RPCServerOptions, extra:any = {}) {
        const server = new RPCServer(options);
        const httpServer = await server.listen(0);
        const port = (httpServer.address() as AddressInfo).port;
        const endpoint = `ws://localhost:${port}`;
        const close = (options?: ServerCloseOptions) => server.close(options);
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

            let servCli: RPCClient;
            const {endpoint, close} = await createServer({}, {
                withClient: (cli: RPCServerClient) => {
                    servCli = cli as unknown as RPCClient;
                }
            });
            const cli = new RPCClient({
                endpoint,
                identity: 'X',
            });

            await cli.connect();
            await assert.throws(() => servCli.connect());

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
        const port = (httpServer.address() as AddressInfo).port;
        const endpoint = `ws://localhost:${port}`;

        const test = new Promise<void>((resolve, reject) => {
            server.on('client', cli => {
                const optionKeys: any[] = Object.keys(inheritableOptions);
                const _options: any = cli['_options'];
                for (const optionKey of optionKeys) {
                    const option = _options[optionKey];
                    const inheritedOption: string = (inheritableOptions as any)[optionKey];
                    if (option !== inheritedOption) {
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
        await assert.doesNotReject(test);
    });

});