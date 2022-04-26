
class TimeoutError extends Error {};
class UnexpectedHttpResponse extends Error {};

class RPCGenericError extends Error {
    rpcErrorMessage = '';
    rpcErrorCode = 'GenericError';
};
class RPCNotImplementedError extends RPCGenericError {
    rpcErrorMessage = 'Requested method is not known';
    rpcErrorCode = 'NotImplemented';
};
class RPCNotSupportedError extends RPCGenericError {
    rpcErrorMessage = 'Requested method is recognised but not supported';
    rpcErrorCode = 'NotSupported';
};
class RPCInternalError extends RPCGenericError {
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    rpcErrorCode = 'InternalError';
};
class RPCProtocolError extends RPCGenericError {
    rpcErrorMessage = 'Payload for method is incomplete';
    rpcErrorCode = 'ProtocolError';
};
class RPCSecurityError extends RPCGenericError {
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    rpcErrorCode = 'SecurityError';
};
class RPCFormatViolationError extends RPCGenericError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormatViolation';
};
class RPCPropertyConstraintViolationError extends RPCGenericError {
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    rpcErrorCode = 'PropertyConstraintViolation';
};
class RPCOccurenceConstraintViolationError extends RPCGenericError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurenceConstraintViolation';
};
class RPCTypeConstraintViolationError extends RPCGenericError {
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    rpcErrorCode = 'TypeConstraintViolation';
};
class RPCMessageTypeNotSupportedError extends RPCGenericError {
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    rpcErrorCode = 'MessageTypeNotSupported';
};
class RPCFrameworkError extends RPCGenericError {
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    rpcErrorCode = 'RpcFrameworkError';
};

module.exports = {
    TimeoutError,
    UnexpectedHttpResponse,
    RPCGenericError,
    RPCNotImplementedError,
    RPCNotSupportedError,
    RPCInternalError,
    RPCProtocolError,
    RPCSecurityError,
    RPCFormatViolationError,
    RPCFormationViolationError: RPCFormatViolationError, // to allow for mistake in ocpp1.6j spec
    RPCPropertyConstraintViolationError,
    RPCOccurenceConstraintViolationError,
    RPCTypeConstraintViolationError,
    RPCMessageTypeNotSupportedError,
    RPCFrameworkError,
};