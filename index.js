const RPCClient = require('./lib/client');
const RPCServer = require('./lib/server');
const errors = require('./lib/errors');

module.exports = {
    RPCServer,
    RPCClient,
    ...errors,
};