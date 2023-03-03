export class TimeoutError extends Error {
}
;
export class UnexpectedHttpResponse extends Error {
}
;
export class RPCError extends Error {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = '';
        this.rpcErrorCode = 'GenericError';
    }
}
export class RPCGenericError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = '';
        this.rpcErrorCode = 'GenericError';
    }
}
;
export class RPCNotImplementedError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Requested method is not known';
        this.rpcErrorCode = 'NotImplemented';
    }
}
;
export class RPCNotSupportedError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Requested method is recognised but not supported';
        this.rpcErrorCode = 'NotSupported';
    }
}
;
export class RPCInternalError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
        this.rpcErrorCode = 'InternalError';
    }
}
;
export class RPCProtocolError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for method is incomplete';
        this.rpcErrorCode = 'ProtocolError';
    }
}
;
export class RPCSecurityError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
        this.rpcErrorCode = 'SecurityError';
    }
}
;
export class RPCFormatViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
        this.rpcErrorCode = 'FormatViolation';
    }
}
;
export class RPCFormationViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
        this.rpcErrorCode = 'FormationViolation';
    }
}
;
export class RPCPropertyConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
        this.rpcErrorCode = 'PropertyConstraintViolation';
    }
}
;
export class RPCOccurenceConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
        this.rpcErrorCode = 'OccurenceConstraintViolation';
    }
}
;
export class RPCOccurrenceConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
        this.rpcErrorCode = 'OccurrenceConstraintViolation';
    }
}
;
export class RPCTypeConstraintViolationError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
        this.rpcErrorCode = 'TypeConstraintViolation';
    }
}
;
export class RPCMessageTypeNotSupportedError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
        this.rpcErrorCode = 'MessageTypeNotSupported';
    }
}
;
export class RPCFrameworkError extends RPCError {
    constructor() {
        super(...arguments);
        this.rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
        this.rpcErrorCode = 'RpcFrameworkError';
    }
}
;
export class WebsocketUpgradeError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
