/// <reference types="node" />
import { ClientRequest, IncomingMessage } from "http";
export declare class TimeoutError extends Error {
}
export declare class UnexpectedHttpResponse extends Error {
    code?: number;
    request?: ClientRequest;
    response?: IncomingMessage;
}
export declare class RPCError extends Error {
    rpcErrorMessage: string;
    rpcErrorCode: string;
    details?: object;
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
    code: number;
    constructor(code: number, message: string);
}
