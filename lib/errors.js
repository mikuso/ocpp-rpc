
export class TimeoutError extends Error {

};

/**
 * An error which occurs when a Websocket HTTP upgrade fails due to receiving an unexpected response from the server.
 */
export class UnexpectedHttpResponse extends Error {

    /**
     * An error which occurs when a Websocket HTTP upgrade fails due to receiving an unexpected response from the server.
     * 
     * @param {string | undefined} message
     * @param {object} obj
     * @param {number} [obj.code]
     * @param {http.ClientRequest} obj.request
     * @param {http.IncomingMessage} obj.response
     */
    constructor(message, {code, request, response}) {
        super(message);

        /** @type {number | undefined} */
        this.code = code;

        /** @type {http.ClientRequest} */
        this.request = request;

        /** @type {http.IncomingMessage} */
        this.response = response;
    }
};

/**
 * An error representing a violation of the RPC protocol. Throwing an RPCError from within a
 * registered handler will pass the RPCError back to the caller.
 * 
 * To create an RPCError, use the utility function `createRPCError()`.
 */
export class RPCError extends Error {
    /**
     * The human-readable RPC error message.
     * @type {string}
     * @const
     */
    rpcErrorMessage = '';
    /**
     * The OCPP-J RPC error code.
     * @type {string}
     * @const
     */
    rpcErrorCode = 'GenericError';

    /**
     * An object containing additional error details.
     * @type {object}
     */
    details = {};
}

/**
 * A generic error when no more specific error is appropriate.
 */
export class RPCGenericError extends RPCError {
    /** @const */
    rpcErrorMessage = '';
    /** @const */
    rpcErrorCode = 'GenericError';
}

/**
 * Requested method is not known.
 */
export class RPCNotImplementedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Requested method is not known';
    /** @const */
    rpcErrorCode = 'NotImplemented';
}

/**
 * Requested method is recognised but not supported.
 */
export class RPCNotSupportedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Requested method is recognised but not supported';
    /** @const */
    rpcErrorCode = 'NotSupported';
}

/**
 * An internal error occurred and the receiver was not able to process the requested method successfully.
 */
export class RPCInternalError extends RPCError {
    /** @const */
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    /** @const */
    rpcErrorCode = 'InternalError';
}

/**
 * Payload for method is incomplete.
 */
export class RPCProtocolError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for method is incomplete';
    /** @const */
    rpcErrorCode = 'ProtocolError';
}

/**
 * During the processing of method a security issue occurred preventing receiver from completing the method successfully.
 */
export class RPCSecurityError extends RPCError {
    /** @const */
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    /** @const */
    rpcErrorCode = 'SecurityError';
}

/**
 * Payload for the method is syntactically incorrect or not conform the PDU structure for the method.
 */
export class RPCFormatViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    /** @const */
    rpcErrorCode = 'FormatViolation';
}

/**
 * @deprecated Same as FormatViolation. Retained for backwards compatibility with OCPP versions 1.6 and below.
 */
export class RPCFormationViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    /** @const */
    rpcErrorCode = 'FormationViolation';
}

/**
 * Payload is syntactically correct but at least one field contains an invalid value.
 */
export class RPCPropertyConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    /** @const */
    rpcErrorCode = 'PropertyConstraintViolation';
}

/**
 * @deprecated Same as OccurrenceConstraintViolation. Retained for backwards compatibility with OCPP versions 1.6 and below.
 */
export class RPCOccurenceConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurence constraints';
    /** @const */
    rpcErrorCode = 'OccurenceConstraintViolation';
}

/**
 * Payload for the method is syntactically correct but at least one of the fields violates occurrence constraints.
 */
export class RPCOccurrenceConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurrence constraints';
    /** @const */
    rpcErrorCode = 'OccurrenceConstraintViolation';
}

/**
 * Payload for the method is syntactically correct but at least one of the fields violates data type constraints.
 */
export class RPCTypeConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    /** @const */
    rpcErrorCode = 'TypeConstraintViolation';
}

/**
 * A message with a Message Type Number received is not supported by this implementation.
 */
export class RPCMessageTypeNotSupportedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    /** @const */
    rpcErrorCode = 'MessageTypeNotSupported';
}

/**
 * Content of the call is not a valid RPC Request, for example: MessageId could not be read.
 */
export class RPCFrameworkError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    /** @const */
    rpcErrorCode = 'RpcFrameworkError';
}

export class WebsocketUpgradeError extends Error {
    /**
     * 
     * @param {number} code 
     * @param {string} [message] 
     */
    constructor(code, message) {
        super(message);

        /** @type {number} */
        this.code = code;
    }
}
