export { RPCClient, MessageType } from './lib/client.js';
export { RPCServer } from './lib/server.js';
export { RPCServerClient } from './lib/server-client.js';
export * from './lib/errors.js';
export * from './lib/symbols.js';
export { ConnectionState, createRPCError } from './lib/util.js';
export { createValidator } from './lib/validator.js';

/** @typedef {import('./lib/client.js').RPCClientOptions} RPCClientOptions */
/** @typedef {import('./lib/client.js').MsgCall} MsgCall */
/** @typedef {import('./lib/client.js').MsgCallResult} MsgCallResult */
/** @typedef {import('./lib/client.js').MsgCallError} MsgCallError */
/** @typedef {import('./lib/client.js').MsgCallResultError} MsgCallResultError */
/** @typedef {import('./lib/client.js').MsgSend} MsgSend */
/** @typedef {import('./lib/server-client.js').Handshake} Handshake */
/** @typedef {import('./lib/server.js').AuthCallback} AuthCallback */
/** @typedef {import('./lib/server.js').ClientAcceptCallback} ClientAcceptCallback */
/** @typedef {import('./lib/server.js').ClientRejectCallback} ClientRejectCallback */
/** @typedef {import('./lib/server.js').RPCServerOptions} RPCServerOptions */
