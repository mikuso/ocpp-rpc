
class TimeoutError extends Error {};
class MalformedMessageError extends Error {};
class UnexpectedHttpResponse extends Error {};

class MissingSubprotocolError extends Error {
    statusCode = 1002;
};

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
class RPCFormationViolationError extends RPCGenericError {
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    rpcErrorCode = 'FormationViolation';
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

function createRPCError(type, message, details) {
    let E = RPCGenericError;
    switch (type) {
        case 'GenericError': E = RPCGenericError; break;
        case 'NotImplemented': E = RPCNotImplementedError; break;
        case 'NotSupported': E = RPCNotSupportedError; break;
        case 'InternalError': E = RPCInternalError; break;
        case 'ProtocolError': E = RPCProtocolError; break;
        case 'SecurityError': E = RPCSecurityError; break;
        case 'FormationViolation': E = RPCFormationViolationError; break;
        case 'PropertyConstraintViolation': E = RPCPropertyConstraintViolationError; break;
        case 'OccurenceConstraintViolation': E = RPCOccurenceConstraintViolationError; break;
        case 'TypeConstraintViolation': E = RPCTypeConstraintViolationError; break;
    }
    const err = new E(message);
    err.details = details;
    return err;
}

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
    createRPCError,
};