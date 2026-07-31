export { RPCClient } from './lib/client.js';
export { RPCServer } from './lib/server.js';
export { RPCServerClient } from './lib/server-client.js';
export * from './lib/errors.js';
export * from './lib/symbols.js';
export { createRPCError } from './lib/util.js';
export { createValidator } from './lib/validator.js';

/** @typedef {import('./lib/client.js').ConnectionState} ConnectionState
 * @group Types */

/** @typedef {import('./lib/client.js').RPCClientOptions} RPCClientOptions
 * @group Types */

/** @typedef {import('./lib/server-client.js').Handshake} Handshake
 * @group Types */

/** @typedef {import('./lib/server.js').AuthCallback} AuthCallback
 * @group Types */

/** @typedef {import('./lib/server.js').RPCServerOptions} RPCServerOptions
 * @group Types */
