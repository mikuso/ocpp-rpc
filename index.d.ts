declare module 'ocpp-rpc' {
  import Ajv, { ValidateFunction } from 'ajv';
  import { WebSocket } from '@types/ws';
  import { ExponentialStrategy } from '@types/backoff';
  import { EventEmitter } from 'events';
  import { URLSearchParams } from 'url';
  import { IncomingMessage, IncomingHttpHeaders, OutgoingHttpHeaders, Server as HttpServer } from 'http';
  import { Duplex } from 'stream';
  import errors from 'ocpp-rpc/lib/errors';
  import symbols from 'ocpp-rpc/lib/symbols';
  import { Ocpp20Types } from 'ocpp-standard-schema'; // WIP

  interface OCPPTypes {
    Authorize: {
      request: Ocpp20Types.AuthorizeRequest,
      response: Ocpp20Types.AuthorizeResponse,
    };
    BootNotification: {
      request: Ocpp20Types.BootNotificationRequest,
      response: Ocpp20Types.BootNotificationResponse,
    };
    CancelReservation: {
      request: Ocpp20Types.CancelReservationRequest,
      response: Ocpp20Types.CancelReservationResponse,
    };
    // CertificateSigned: {
    //   request: Ocpp20Types.CertificateSignedRequest,
    //   response: Ocpp20Types.CertificateSignedResponse,
    // }
    ChangeAvailability: {
      request: Ocpp20Types.ChangeAvailabilityRequest,
      response: Ocpp20Types.ChangeAvailabilityResponse,
    };
    ClearCache: {
      request: Ocpp20Types.ClearCacheRequest,
      response: Ocpp20Types.ClearCacheResponse,
    };
    ClearChargingProfile: {
      request: Ocpp20Types.ClearChargingProfileRequest,
      response: Ocpp20Types.ClearChargingProfileResponse,
    };
    ClearDisplayMessage: {
      request: Ocpp20Types.ClearDisplayMessageRequest,
      response: Ocpp20Types.ClearDisplayMessageResponse,
    };
    ClearedChargingLimit: {
      request: Ocpp20Types.ClearedChargingLimitRequest,
      response: Ocpp20Types.ClearedChargingLimitResponse,
    };
    ClearVariableMonitoring: {
      request: Ocpp20Types.ClearVariableMonitoringRequest,
      response: Ocpp20Types.ClearVariableMonitoringResponse,
    };
    CostUpdate: {
      request: Ocpp20Types.CostUpdatedRequest,
      response: Ocpp20Types.CostUpdatedResponse,
    };
    CustomerInformation: {
      request: Ocpp20Types.CustomerInformationRequest,
      response: Ocpp20Types.CustomerInformationResponse,
    };
    DataTransfer: {
      request: Ocpp20Types.DataTransferRequest,
      response: Ocpp20Types.DataTransferResponse,
    };
    DeleteCertificate: {
      request: Ocpp20Types.DeleteCertificateRequest,
      response: Ocpp20Types.DeleteCertificateResponse,
    };
    FirmwareStatusNotification: {
      request: Ocpp20Types.FirmwareStatusNotificationRequest,
      response: Ocpp20Types.FirmwareStatusNotificationResponse,
    };
    Get15118EVCertificate: {
      request: Ocpp20Types.Get15118EVCertificateRequest,
      response: Ocpp20Types.Get15118EVCertificateResponse,
    };
    GetBaseReport: {
      request: Ocpp20Types.GetBaseReportRequest,
      response: Ocpp20Types.GetBaseReportResponse,
    };
    GetCertificateStatus: {
      request: Ocpp20Types.GetCertificateStatusRequest,
      response: Ocpp20Types.GetCertificateStatusResponse,
    };
    GetChargingProfiles: {
      request: Ocpp20Types.GetChargingProfilesRequest,
      response: Ocpp20Types.GetChargingProfilesResponse,
    };
    GetCompositeSchedule: {
      request: Ocpp20Types.GetCompositeScheduleRequest,
      response: Ocpp20Types.GetCompositeScheduleResponse,
    };
    GetDisplayMessages: {
      request: Ocpp20Types.GetDisplayMessagesRequest,
      response: Ocpp20Types.GetDisplayMessagesResponse,
    };
    GetInstalledCertificateIds: {
      request: Ocpp20Types.GetInstalledCertificateIdsRequest,
      response: Ocpp20Types.GetInstalledCertificateIdsResponse,
    };
    GetLocalListVersion: {
      request: Ocpp20Types.GetLocalListVersionRequest,
      response: Ocpp20Types.GetLocalListVersionResponse,
    };
    GetLog: {
      request: Ocpp20Types.GetLogRequest,
      response: Ocpp20Types.GetLogResponse,
    };
    GetMonitoringReport: {
      request: Ocpp20Types.GetMonitoringReportRequest,
      response: Ocpp20Types.GetMonitoringReportResponse,
    };
    GetReport: {
      request: Ocpp20Types.GetReportRequest,
      response: Ocpp20Types.GetReportResponse,
    };
    GetTransactionStatus: {
      request: Ocpp20Types.GetTransactionStatusRequest,
      response: Ocpp20Types.GetTransactionStatusResponse,
    };
    GetVariables: {
      request: Ocpp20Types.GetVariablesRequest,
      response: Ocpp20Types.GetVariablesResponse,
    };
    Heartbeat: {
      request: Ocpp20Types.HeartbeatRequest,
      response: Ocpp20Types.HeartbeatResponse,
    };
    InstallCertificate: {
      request: Ocpp20Types.InstallCertificateRequest,
      response: Ocpp20Types.InstallCertificateResponse,
    };
    LogStatusNotification: {
      request: Ocpp20Types.LogStatusNotificationRequest,
      response: Ocpp20Types.LogStatusNotificationResponse,
    };
    MeterValues: {
      request: Ocpp20Types.MeterValuesRequest,
      response: Ocpp20Types.MeterValuesResponse,
    };
    // NotifyChargingLimit: {
    //   request: Ocpp20Types.NotifyChargingLimitRequest,
    //   response: Ocpp20Types.NotifyChargingLimitResponse,
    // }
    NotifyCustomerInformation: {
      request: Ocpp20Types.NotifyCustomerInformationRequest,
      response: Ocpp20Types.NotifyCustomerInformationResponse,
    };
    NotifyDisplayMessages: {
      request: Ocpp20Types.NotifyDisplayMessagesRequest,
      response: Ocpp20Types.NotifyDisplayMessagesResponse,
    };
    NotifyEVChargingNeeds: {
      request: Ocpp20Types.NotifyEVChargingNeedsRequest,
      response: Ocpp20Types.NotifyEVChargingNeedsResponse,
    };
    // NotifyEVChargingSchedule: {
    //   request: Ocpp20Types.NotifyEVChargingScheduleRequest,
    //   response: Ocpp20Types.NotifyEVChargingScheduleResponse,
    // }
    NotifyEvent: {
      request: Ocpp20Types.NotifyEventRequest,
      response: Ocpp20Types.NotifyEventResponse,
    };
    NotifyMonitoringReport: {
      request: Ocpp20Types.NotifyMonitoringReportRequest,
      response: Ocpp20Types.NotifyMonitoringReportResponse,
    };
    NotifyReport: {
      request: Ocpp20Types.NotifyReportRequest,
      response: Ocpp20Types.NotifyReportResponse,
    };
    PublishFirmware: {
      request: Ocpp20Types.PublishFirmwareRequest,
      response: Ocpp20Types.PublishFirmwareResponse,
    };
    PublishFirmwareStatusNotification: {
      request: Ocpp20Types.PublishFirmwareStatusNotificationRequest,
      response: Ocpp20Types.PublishFirmwareStatusNotificationResponse,
    };
    ReportChargingProfiles: {
      request: Ocpp20Types.ReportChargingProfilesRequest,
      response: Ocpp20Types.ReportChargingProfilesResponse,
    };
    RequestStartTransaction: {
      request: Ocpp20Types.RequestStartTransactionRequest,
      response: Ocpp20Types.RequestStartTransactionResponse,
    };
    RequestStopTransaction: {
      request: Ocpp20Types.RequestStopTransactionRequest,
      response: Ocpp20Types.RequestStopTransactionResponse,
    };
    ReservationStatusUpdate: {
      request: Ocpp20Types.ReservationStatusUpdateRequest,
      response: Ocpp20Types.ReservationStatusUpdateResponse,
    };
    ReserveNow: {
      request: Ocpp20Types.ReserveNowRequest,
      response: Ocpp20Types.ReserveNowResponse,
    };
    Reset: {
      request: Ocpp20Types.ResetRequest,
      response: Ocpp20Types.ResetResponse,
    };
    SecurityEventNotification: {
      request: Ocpp20Types.SecurityEventNotificationRequest,
      response: Ocpp20Types.SecurityEventNotificationResponse,
    };
    SendLocalList: {
      request: Ocpp20Types.SendLocalListRequest,
      response: Ocpp20Types.SendLocalListResponse,
    };
    SetChargingProfile: {
      request: Ocpp20Types.SetChargingProfileRequest,
      response: Ocpp20Types.SetChargingProfileResponse,
    };
    SetDisplayMessage: {
      request: Ocpp20Types.SetDisplayMessageRequest,
      response: Ocpp20Types.SetDisplayMessageResponse,
    };
    SetMonitoringBase: {
      request: Ocpp20Types.SetMonitoringBaseRequest,
      response: Ocpp20Types.SetMonitoringBaseResponse,
    };
    SetMonitoringLevel: {
      request: Ocpp20Types.SetMonitoringLevelRequest,
      response: Ocpp20Types.SetMonitoringLevelResponse,
    };
    SetNetworkProfile: {
      request: Ocpp20Types.SetNetworkProfileRequest,
      response: Ocpp20Types.SetNetworkProfileResponse,
    };
    SetVariableMonitoring: {
      request: Ocpp20Types.SetVariableMonitoringRequest,
      response: Ocpp20Types.SetVariableMonitoringResponse,
    };
    SetVariables: {
      request: Ocpp20Types.SetVariablesRequest,
      response: Ocpp20Types.SetVariablesResponse,
    };
    SignCertificate: {
      request: Ocpp20Types.SignCertificateRequest,
      response: Ocpp20Types.SignCertificateResponse,
    };
    StatusNotification: {
      request: Ocpp20Types.StatusNotificationRequest,
      response: Ocpp20Types.StatusNotificationResponse,
    };
    TransactionEvent: {
      request: Ocpp20Types.TransactionEventRequest,
      response: Ocpp20Types.TransactionEventResponse,
    };
    TriggerMessage: {
      request: Ocpp20Types.TriggerMessageRequest,
      response: Ocpp20Types.TriggerMessageResponse,
    };
    UnlockConnector: {
      request: Ocpp20Types.UnlockConnectorRequest,
      response: Ocpp20Types.UnlockConnectorResponse,
    };
    UnpublishFirmware: {
      request: Ocpp20Types.UnpublishFirmwareRequest,
      response: Ocpp20Types.UnpublishFirmwareResponse,
    };
    UpdateFirmware: {
      request: Ocpp20Types.UpdateFirmwareRequest,
      response: Ocpp20Types.UpdateFirmwareResponse,
    };
  }

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

  type BaseHandler<M extends keyof OCPPTypes | string = string, Res = M extends keyof OCPPTypes ? OCPPTypes[M]['response'] : unknown> = (obj: {
    // The name of the method being invoked (useful for wildcard handlers).
    method: M,
    // The parameters of the call.
    params: M extends keyof OCPPTypes ? OCPPTypes[M]['request'] : unknown,
    // A signal which will abort if the underlying connection is dropped (therefore, the response will never be received by the caller). You may choose whether to ignore the signal or not, but it could save you some time if you use it to abort the call early.
    signal: AbortSignal,
    // The OCPP Message ID used in the call.
    messageId: string,
    // A callback function with which to pass a response to the call. Accepts a response value, an Error, or a Promise.
    reply: (response: Res | Error) => void
  }) => (Promise<Res | void>) | Res | void;

  interface ClientHandler {
    // wildcardHandler
    (handler: BaseHandler): void;
    <T extends keyof OCPPTypes>(method: T, handler: BaseHandler<T>): void;
    (method: string, handler: BaseHandler<string>): void;
  }


  export class RPCClient extends EventEmitter {
    get identity(): string;
    get protocol(): OCPPProtocols;
    get state(): CONNECTION_STATE;
    reconfigure(options: RPCClientConstructorOptions): void;
    connect: () => Promise<ConnectResponse | ConnectResponse<ConnectResponse> | undefined>;
    close: (options?: {
      // The WebSocket close code. Defaults to 1000
      code?: number,
      // The reason for closure. Defaults to ''.
      reason?: string,
      //  If true, the connection won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime. Defaults to false.
      awaitPending?: boolean,
      // If true, terminates the WebSocket connection instantly and uncleanly. Defaults to false.
      force?: boolean
    }) => Promise<Record<string, unknown>>;
    // WIP
    sendRaw: (message: Array | number | Record<string, unknown> | string | ArrayBuffer | Buffer | DataView) => void; // TypedArray?
    handle: ClientHandler;
    call: <M extends keyof OCPPTypes | string>(
      method: M,
      params: M extends keyof OCPPTypes ? OCPPTypes[M]['request'] : unknown,
      options?: {
        callTimeoutMs: number;
        signal: AbortSignal;
        noReply: boolean;
      }) => Promise<M extends keyof OCPPTypes ? OCPPTypes[M]['response'] : unknown>;
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
  type reject = (code?: number, message?: string) => void;
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

  type clientEvent = (event: 'client', handler: (client: RPCClient) => void) => void;

  export class RPCServer extends EventEmitter {
    constructor(options?: RPCServerConstructorOptions);
    auth: (cb: authCb) => void;
    handleUpgrade(): (request: IncomingMessage, socket: Duplex, head: Buffer) => void;
    reconfigure: (options: RPCServerConstructorOptions) => void;
    close(options?: {
      //The WebSocket close code to pass to all connected clients. Defaults to 1000.
      code?: number,
      //The reason for closure to pass to all connected clients. Defaults to ''.
      reason?: string,
      //If true, each connected client won't be fully closed until any outstanding in-flight (inbound & outbound) calls are responded to. Additional calls will be rejected in the meantime. Defaults to false.
      awaitPending?: boolean,
      //If true, terminates all client WebSocket connections instantly and uncleanly. Defaults to false.)
      force?: boolean
    }): void;
    on: InstanceType<typeof EventEmitter>['on'] | clientEvent;
    listen(
      port: number,
      host?: string,
      options?: {
        signal: AbortSignal,
      }
    ): Promise<HttpServer>
  }

  export const createRPCError: (type: string, message?: string, details?: Record<string, unknown>) => Error;
  export const createValidator: (subprotocol: any, json: any) => Validator;
  export { symbols };
  export { errors };
}

