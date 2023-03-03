"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketUpgradeError = exports.RPCFrameworkError = exports.RPCMessageTypeNotSupportedError = exports.RPCTypeConstraintViolationError = exports.RPCOccurrenceConstraintViolationError = exports.RPCOccurenceConstraintViolationError = exports.RPCPropertyConstraintViolationError = exports.RPCFormationViolationError = exports.RPCFormatViolationError = exports.RPCSecurityError = exports.RPCProtocolError = exports.RPCInternalError = exports.RPCNotSupportedError = exports.RPCNotImplementedError = exports.RPCGenericError = exports.RPCError = exports.UnexpectedHttpResponse = exports.TimeoutError = void 0;
class TimeoutError extends Error {
}
exports.TimeoutError = TimeoutError;
;
class UnexpectedHttpResponse extends Error {
}
exports.UnexpectedHttpResponse = UnexpectedHttpResponse;
;
class RPCError extends Error {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = '';
        this.rpcErrorCode = 'GenericError';
    }
}
exports.RPCError = RPCError;
class RPCGenericError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = '';
        this.rpcErrorCode = 'GenericError';
    }
}
exports.RPCGenericError = RPCGenericError;
;
class RPCNotImplementedError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Requested method is not known';
        this.rpcErrorCode = 'NotImplemented';
    }
}
exports.RPCNotImplementedError = RPCNotImplementedError;
;
class RPCNotSupportedError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Requested method is recognised but not supported';
        this.rpcErrorCode = 'NotSupported';
    }
}
exports.RPCNotSupportedError = RPCNotSupportedError;
;
class RPCInternalError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
        this.rpcErrorCode = 'InternalError';
    }
}
exports.RPCInternalError = RPCInternalError;
;
class RPCProtocolError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for method is incomplete';
        this.rpcErrorCode = 'ProtocolError';
    }
}
exports.RPCProtocolError = RPCProtocolError;
;
class RPCSecurityError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
        this.rpcErrorCode = 'SecurityError';
    }
}
exports.RPCSecurityError = RPCSecurityError;
;
class RPCFormatViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
        this.rpcErrorCode = 'FormatViolation';
    }
}
exports.RPCFormatViolationError = RPCFormatViolationError;
;
class RPCFormationViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
        this.rpcErrorCode = 'FormationViolation';
    }
}
exports.RPCFormationViolationError = RPCFormationViolationError;
;
class RPCPropertyConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
        this.rpcErrorCode = 'PropertyConstraintViolation';
    }
}
exports.RPCPropertyConstraintViolationError = RPCPropertyConstraintViolationError;
;
class RPCOccurenceConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
        this.rpcErrorCode = 'OccurenceConstraintViolation';
    }
}
exports.RPCOccurenceConstraintViolationError = RPCOccurenceConstraintViolationError;
;
class RPCOccurrenceConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
        this.rpcErrorCode = 'OccurrenceConstraintViolation';
    }
}
exports.RPCOccurrenceConstraintViolationError = RPCOccurrenceConstraintViolationError;
;
class RPCTypeConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
        this.rpcErrorCode = 'TypeConstraintViolation';
    }
}
exports.RPCTypeConstraintViolationError = RPCTypeConstraintViolationError;
;
class RPCMessageTypeNotSupportedError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
        this.rpcErrorCode = 'MessageTypeNotSupported';
    }
}
exports.RPCMessageTypeNotSupportedError = RPCMessageTypeNotSupportedError;
;
class RPCFrameworkError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
        this.rpcErrorCode = 'RpcFrameworkError';
    }
}
exports.RPCFrameworkError = RPCFrameworkError;
;
class WebsocketUpgradeError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.WebsocketUpgradeError = WebsocketUpgradeError;
