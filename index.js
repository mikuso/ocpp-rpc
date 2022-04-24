const RPCClient = require('./lib/client');
const RPCServer = require('./lib/server');
const errors = require('./lib/errors');
const { createRPCError } = require('./lib/util');

module.exports = {
    RPCServer,
    RPCClient,
    ...errors,
    createRPCError,
};