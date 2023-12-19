//@ts-ignore
import RPCClient from './lib/client';
import RPCServer from './lib/server';
const errors = require('./lib/errors');
const symbols = require('./lib/symbols');
const { createRPCError } = require('./lib/util');
const { createValidator } = require('./lib/validator');

export { RPCClient, RPCServer };

export default {
    RPCServer,
    RPCClient,
    createRPCError,
    createValidator,
    ...errors,
    ...symbols,
};
