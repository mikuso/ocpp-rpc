
class TimeoutError extends Error {};
class UnexpectedHttpResponse extends Error {};

class RPCError extends Error {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
}
class RPCGenericError extends RPCError {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
};
class RPCNotImplementedError extends RPCError {
    rpcErrorMessage = 'Requested method is not known';
    rpcErrorCode = 'NotImplemented';
};
class RPCNotSupportedError extends RPCError {
    rpcErrorMessage = 'Requested method is recognised but not supported';
    rpcErrorCode = 'NotSupported';
};
class RPCInternalError extends RPCError {
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    rpcErrorCode = 'InternalError';
};
class RPCProtocolError extends RPCError {
    rpcErrorMessage = 'Payload for method is incomplete';
    rpcErrorCode = 'ProtocolError';
};
class RPCSecurityError extends RPCError {
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    rpcErrorCode = 'SecurityError';
};
class RPCFormatViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormatViolation';
};
class RPCFormationViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormationViolation';
};
class RPCPropertyConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    rpcErrorCode = 'PropertyConstraintViolation';
};
class RPCOccurenceConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurenceConstraintViolation';
};
class RPCOccurrenceConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurrenceConstraintViolation';
};
class RPCTypeConstraintViolationError extends RPCError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    rpcErrorCode = 'TypeConstraintViolation';
};
class RPCMessageTypeNotSupportedError extends RPCError {
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    rpcErrorCode = 'MessageTypeNotSupported';
};
class RPCFrameworkError extends RPCError {
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    rpcErrorCode = 'RpcFrameworkError';
};

module.exports = {
    TimeoutError,
    UnexpectedHttpResponse,
    RPCError,
    RPCGenericError,
    RPCNotImplementedError,
    RPCNotSupportedError,
    RPCInternalError,
    RPCProtocolError,
    RPCSecurityError,
    RPCFormatViolationError,
    RPCFormationViolationError, // to allow for mistake in ocpp1.6j spec
    RPCPropertyConstraintViolationError,
    RPCOccurrenceConstraintViolationError,
    RPCOccurenceConstraintViolationError, // to allow for mistake in ocpp1.6j spec
    RPCTypeConstraintViolationError,
    RPCMessageTypeNotSupportedError,
    RPCFrameworkError,
};