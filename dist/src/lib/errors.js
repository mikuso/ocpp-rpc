export class TimeoutError extends Error {
}
;
export class UnexpectedHttpResponse extends Error {
}
;
export class RPCError extends Error {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
    details;
}
export class RPCGenericError extends RPCError {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
}
;
export class RPCNotImplementedError extends RPCError {
    rpcErrorMessage = 'Requested method is not known';
    rpcErrorCode = 'NotImplemented';
}
;
export class RPCNotSupportedError extends RPCError {
    rpcErrorMessage = 'Requested method is recognised but not supported';
    rpcErrorCode = 'NotSupported';
}
;
export class RPCInternalError extends RPCError {
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    rpcErrorCode = 'InternalError';
}
;
export class RPCProtocolError extends RPCError {
    rpcErrorMessage = 'Payload for method is incomplete';
    rpcErrorCode = 'ProtocolError';
}
;
export class RPCSecurityError extends RPCError {
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    rpcErrorCode = 'SecurityError';
}
;
export class RPCFormatViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormatViolation';
}
;
// to allow for mistake in ocpp1.6j spec
export class RPCFormationViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormationViolation';
}
;
export class RPCPropertyConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    rpcErrorCode = 'PropertyConstraintViolation';
}
;
// to allow for mistake in ocpp1.6j spec
export class RPCOccurenceConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurenceConstraintViolation';
}
;
export class RPCOccurrenceConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurrenceConstraintViolation';
}
;
export class RPCTypeConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    rpcErrorCode = 'TypeConstraintViolation';
}
;
export class RPCMessageTypeNotSupportedError extends RPCError {
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    rpcErrorCode = 'MessageTypeNotSupported';
}
;
export class RPCFrameworkError extends RPCError {
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    rpcErrorCode = 'RpcFrameworkError';
}
;
export class WebsocketUpgradeError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
