
import Ajv, { ValidateFunction } from 'ajv';
import { WebSocket } from 'ws';
import { ExponentialStrategy } from 'backoff';
import { EventEmitter } from 'events';
import { URLSearchParams } from 'url';
import { IncomingMessage, IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { Duplex } from 'stream';
import errors from './lib/errors';
import symbols from './lib/symbols';
declare module 'ocpp-rpc' {

  type OCPPProtocols = 'ocpp2.0.1' | 'ocpp1.6';
  enum CONNECTION_STATE {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
  }

  // ref './lib/validator.js'
  class Validator {
    constructor(subprotocol: string, ajv: Ajv);
    get subprotocol(): string;
    validate(schemaId: string, params: unknown): ValidateFunction;
  }


  type RPCClientConstructorOptions = {
    // The RPC server's endpoint (a websocket URL). Required.
    endpoint: string,
    // The RPC client's identity. Will be automatically encoded. Required.
    identity: string,
    // Array of subprotocols supported by this server. Can be overridden in an auth callback. Defaults to [].
    protocols?: Array<OCPPProtocols>,
    // Optional password to use in HTTP Basic auth. (The username will always be the identity).
    password?: string,
    // Additional HTTP headers to send along with the websocket upgrade request. Defaults to {}.
    headers: OutgoingHttpHeaders,
    // An optional query string or object to append as the query string of the connection URL. Defaults to ''.
    query: Record<string, unknown> | string,
    // Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to 60000.
    callTimeoutMs?: number,
    // Milliseconds between WebSocket pings to connected clients. Defaults to 30000.
    pingIntervalMs?: number,
    // Enable strict validation of calls & responses. Defaults to false. (See Strict Validation to understand how this works.)
    strictMode?: boolean,
    // Optional additional validators to be used in conjunction with strictMode. (See Strict Validation to understand how this works.)
    strictModeValidators?: Array<Validator>,
    // Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to false.
    respondWithDetailedErrors?: boolean,
    // The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. (There is no limit on inbound calls.) Defaults to 1.
    callConcurrency?: number,
    // If true, the client will attempt to reconnect after losing connection to the
    reconnect: boolean,
    // If reconnect is true, specifies the number of times to try reconnecting before failing and emitting a close event. Defaults to Infinity.
    maxReconnects: number,
    // If reconnect is true, specifies the options for an ExponentialStrategy backoff strategy, used for reconnects.
    backoff: ConstructorParameters<typeof ExponentialStrategy>,
    // he maximum number of non-conforming RPC messages which can be tolerated by the server before the client is automatically closed. Defaults to Infinity.
    maxBadMessages?: number,
    // Additional WebSocketServer options.
    wssOptions?: ConstructorParameters<typeof WebSocket.WebSocketServer>,
  }
  type ConnectResponse = { response?: IncomingMessage }

  export class RPCClient extends EventEmitter {
    get identity(): string;
    get protocol(): OCPPProtocols;
    get state(): CONNECTION_STATE;
    reconfigure(options: RPCClientConstructorOptions): void;
    connect: () => Promise<ConnectResponse | ConnectResponse<ConnectResponse> | undefined>;
    close: (options?: {
      // The WebSocket close code. Defaults to 1000
      code?: Number,
      // The reason for closure. Defaults to ''.
      reason?: string,
      //  If true, the connection won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime. Defaults to false.
      awaitPending?: boolean,
      // If true, terminates the WebSocket connection instantly and uncleanly. Defaults to false.
      force?: boolean
    }) => Promise<Record<string, unknown>>;
    // WIP
    sendRaw: (message: Array | Number | Object | String | ArrayBuffer | Buffer | DataView) => void; // TypedArray?
    handle(method?: string, handler: Function): void;
    call(method: string, params: any, options?: {
      callTimeoutMs: number;
      signal: AbortSignal;
      noReply: boolean;
    }): Promise<any>;
  }


  type RPCServerConstructorOptions = {
    // Array of subprotocols supported by this server. Can be overridden in an auth callback. Defaults to [].
    protocols?: Array<OCPPProtocols>,
    // Milliseconds to wait before unanswered outbound calls are rejected automatically. Defaults to 60000.
    callTimeoutMs?: number,
    // Milliseconds between WebSocket pings to connected clients. Defaults to 30000.
    pingIntervalMs?: number,
    // Specifies whether to send detailed errors (including stack trace) to remote party upon an error being thrown by a handler. Defaults to false.
    respondWithDetailedErrors?: boolean,
    // The number of concurrent in-flight outbound calls permitted at any one time. Additional calls are queued. (There is no limit on inbound calls.) Defaults to 1.
    callConcurrency?: number,
    // Enable strict validation of calls & responses. Defaults to false. (See Strict Validation to understand how this works.)
    strictMode?: boolean,
    // Optional additional validators to be used in conjunction with strictMode. (See Strict Validation to understand how this works.)
    strictModeValidators?: Array<Validator>,
    // he maximum number of non-conforming RPC messages which can be tolerated by the server before the client is automatically closed. Defaults to Infinity.
    maxBadMessages?: number,
    // Additional WebSocketServer options.
    wssOptions?: ConstructorParameters<typeof WebSocket.Server>,
  }

  type accept = (session?: unknown, protocol?: OCPPProtocols) => void;
  type reject = (code: number, message: string) => void;
  type handshake = {
    // A set of subprotocols purportedly supported by the client.
    protocols: Set<OCPPProtocols>,
    // The identity portion of the connection URL, decoded.
    identity: string,
    // If HTTP Basic auth was used in the connection, and the username correctly matches the identity, this field will contain the password (otherwise undefined). Read Security Profile 1 for more details of how this works.
    password: string,
    // The endpoint path portion of the connection URL. This is the part of the path before the identity.
    endpoint: string,
    // The query string parsed as URLSearchParams.
    query: URLSearchParams,
    // The remote IP address of the socket.
    remoteAddress: string,
    // The HTTP headers sent in the upgrade request.
    headers: IncomingHttpHeaders,
    // The full HTTP request received by the underlying webserver.
    request: IncomingMessage,
  };
  type authCb = (accept: accept, reject: reject, handshake: handshake) => void;

  type clientHandler = (client: RPCClient) => void;
  type clientEvent = (event: 'client', handler: clientHandler) => void;

  export class RPCServer extends EventEmitter {
    constructor(options?: RPCServerConstructorOptions)
    auth: (cb: authCb) => void;
    handleUpgrade(): (request: IncomingMessage, socket: Duplex, head: Buffer) => void
    reconfigure: (options: RPCServerConstructorOptions) => void
    close(options?: {
      //The WebSocket close code to pass to all connected clients. Defaults to 1000.
      code?: Number,
      //The reason for closure to pass to all connected clients. Defaults to ''.
      reason?: string,
      //If true, each connected client won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime. Defaults to false.
      awaitPending?: boolean,
      //If true, terminates all client WebSocket connections instantly and uncleanly. Defaults to false.)
      force?: boolean
    }): void;
  }

  export const createRPCError: (type: string, message?: string, details?: Record<string, unknown>) => Error;
  export const createValidator: (subprotocol: any, json: any) => Validator;
  export { symbols }
  export { errors }
}
