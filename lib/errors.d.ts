export declare class TimeoutError extends Error {
}
export declare class UnexpectedHttpResponse extends Error {
    code: any;
    request: any;
    response: any;
}
export declare class RPCError extends Error {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCGenericError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCNotImplementedError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCNotSupportedError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCInternalError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCProtocolError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCSecurityError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCFormatViolationError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCFormationViolationError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCPropertyConstraintViolationError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCOccurenceConstraintViolationError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCOccurrenceConstraintViolationError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCTypeConstraintViolationError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCMessageTypeNotSupportedError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class RPCFrameworkError extends RPCError {
    rpcErrorMessage: string;
    rpcErrorCode: string;
}
export declare class WebsocketUpgradeError extends Error {
    code: any;
    constructor(code: any, message: string | undefined);
}
declare const _default: {
    WebsocketUpgradeError: typeof WebsocketUpgradeError;
    TimeoutError: typeof TimeoutError;
    UnexpectedHttpResponse: typeof UnexpectedHttpResponse;
    RPCError: typeof RPCError;
    RPCGenericError: typeof RPCGenericError;
    RPCNotImplementedError: typeof RPCNotImplementedError;
    RPCNotSupportedError: typeof RPCNotSupportedError;
    RPCInternalError: typeof RPCInternalError;
    RPCProtocolError: typeof RPCProtocolError;
    RPCSecurityError: typeof RPCSecurityError;
    RPCFormatViolationError: typeof RPCFormatViolationError;
    RPCFormationViolationError: typeof RPCFormationViolationError;
    RPCPropertyConstraintViolationError: typeof RPCPropertyConstraintViolationError;
    RPCOccurrenceConstraintViolationError: typeof RPCOccurrenceConstraintViolationError;
    RPCOccurenceConstraintViolationError: typeof RPCOccurenceConstraintViolationError;
    RPCTypeConstraintViolationError: typeof RPCTypeConstraintViolationError;
    RPCMessageTypeNotSupportedError: typeof RPCMessageTypeNotSupportedError;
    RPCFrameworkError: typeof RPCFrameworkError;
};
export default _default;
