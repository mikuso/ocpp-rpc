"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketUpgradeError = exports.RPCFrameworkError = exports.RPCMessageTypeNotSupportedError = exports.RPCTypeConstraintViolationError = exports.RPCOccurrenceConstraintViolationError = exports.RPCOccurenceConstraintViolationError = exports.RPCPropertyConstraintViolationError = exports.RPCFormationViolationError = exports.RPCFormatViolationError = exports.RPCSecurityError = exports.RPCProtocolError = exports.RPCInternalError = exports.RPCNotSupportedError = exports.RPCNotImplementedError = exports.RPCGenericError = exports.RPCError = exports.UnexpectedHttpResponse = exports.TimeoutError = void 0;
class TimeoutError extends Error {
}
exports.TimeoutError = TimeoutError;
;
class UnexpectedHttpResponse extends Error {
    code;
    request;
    response;
}
exports.UnexpectedHttpResponse = UnexpectedHttpResponse;
;
class RPCError extends Error {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
    details;
}
exports.RPCError = RPCError;
class RPCGenericError extends RPCError {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
}
exports.RPCGenericError = RPCGenericError;
;
class RPCNotImplementedError extends RPCError {
    rpcErrorMessage = 'Requested method is not known';
    rpcErrorCode = 'NotImplemented';
}
exports.RPCNotImplementedError = RPCNotImplementedError;
;
class RPCNotSupportedError extends RPCError {
    rpcErrorMessage = 'Requested method is recognised but not supported';
    rpcErrorCode = 'NotSupported';
}
exports.RPCNotSupportedError = RPCNotSupportedError;
;
class RPCInternalError extends RPCError {
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    rpcErrorCode = 'InternalError';
}
exports.RPCInternalError = RPCInternalError;
;
class RPCProtocolError extends RPCError {
    rpcErrorMessage = 'Payload for method is incomplete';
    rpcErrorCode = 'ProtocolError';
}
exports.RPCProtocolError = RPCProtocolError;
;
class RPCSecurityError extends RPCError {
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    rpcErrorCode = 'SecurityError';
}
exports.RPCSecurityError = RPCSecurityError;
;
class RPCFormatViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormatViolation';
}
exports.RPCFormatViolationError = RPCFormatViolationError;
;
// to allow for mistake in ocpp1.6j spec
class RPCFormationViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormationViolation';
}
exports.RPCFormationViolationError = RPCFormationViolationError;
;
class RPCPropertyConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    rpcErrorCode = 'PropertyConstraintViolation';
}
exports.RPCPropertyConstraintViolationError = RPCPropertyConstraintViolationError;
;
// to allow for mistake in ocpp1.6j spec
class RPCOccurenceConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurenceConstraintViolation';
}
exports.RPCOccurenceConstraintViolationError = RPCOccurenceConstraintViolationError;
;
class RPCOccurrenceConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurrenceConstraintViolation';
}
exports.RPCOccurrenceConstraintViolationError = RPCOccurrenceConstraintViolationError;
;
class RPCTypeConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    rpcErrorCode = 'TypeConstraintViolation';
}
exports.RPCTypeConstraintViolationError = RPCTypeConstraintViolationError;
;
class RPCMessageTypeNotSupportedError extends RPCError {
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    rpcErrorCode = 'MessageTypeNotSupported';
}
exports.RPCMessageTypeNotSupportedError = RPCMessageTypeNotSupportedError;
;
class RPCFrameworkError extends RPCError {
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    rpcErrorCode = 'RpcFrameworkError';
}
exports.RPCFrameworkError = RPCFrameworkError;
;
class WebsocketUpgradeError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.WebsocketUpgradeError = WebsocketUpgradeError;
