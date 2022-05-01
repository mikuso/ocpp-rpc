const RPCClient = require('./lib/client');
const RPCServer = require('./lib/server');
const errors = require('./lib/errors');
const { createRPCError } = require('./lib/util');
const { createValidator } = require('./lib/validator');

module.exports = {
    RPCServer,
    RPCClient,
    ...errors,
    createRPCError,
    createValidator,
};