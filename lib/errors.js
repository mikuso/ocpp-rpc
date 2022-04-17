
class TimeoutError extends Error {};
class MalformedMessageError extends Error {};
class UnexpectedHttpResponse extends Error {};

class MissingSubprotocolError extends Error {
    statusCode = 1002;
};

class RPCGenericError extends Error {
    message = '';
    rpcErrorCode = 'GenericError';
};
class RPCNotImplementedError extends RPCGenericError {
    message = 'Requested method is not known';
    rpcErrorCode = 'NotImplemented';
};
class RPCNotSupportedError extends RPCGenericError {
    message = 'Requested method is recognised but not supported';
    rpcErrorCode = 'NotSupported';
};
class RPCInternalError extends RPCGenericError {
    message = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    rpcErrorCode = 'InternalError';
};
class RPCProtocolError extends RPCGenericError {
    message = 'Payload for method is incomplete';
    rpcErrorCode = 'ProtocolError';
};
class RPCSecurityError extends RPCGenericError {
    message = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    rpcErrorCode = 'SecurityError';
};
class RPCFormationViolationError extends RPCGenericError {
    message = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormationViolation';
};
class RPCPropertyConstraintViolationError extends RPCGenericError {
    message = 'Payload is syntactically correct but at least one field contains an invalid value';
    rpcErrorCode = 'PropertyConstraintViolation';
};
class RPCOccurenceConstraintViolationError extends RPCGenericError {
    message = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    rpcErrorCode = 'OccurenceConstraintViolation';
};
class RPCTypeConstraintViolationError extends RPCGenericError {
    message = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    rpcErrorCode = 'TypeConstraintViolation';
};

module.exports = {
    TimeoutError,
    MalformedMessageError,
    UnexpectedHttpResponse,
    MissingSubprotocolError,
    RPCGenericError,
    RPCNotImplementedError,
    RPCNotSupportedError,
    RPCInternalError,
    RPCProtocolError,
    RPCSecurityError,
    RPCFormationViolationError,
    RPCPropertyConstraintViolationError,
    RPCOccurenceConstraintViolationError,
    RPCTypeConstraintViolationError,
};