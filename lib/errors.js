
/**
 * @group Errors
 */
export class TimeoutError extends Error {

};

/**
 * An error which occurs when a Websocket HTTP upgrade fails due to receiving an unexpected response from the server.
 * @group Errors
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
 * @group Errors
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
     * @type {Record<string, *>}
     */
    details = {};
}

/**
 * A generic error when no more specific error is appropriate.
 * @group Errors
 */
export class RPCGenericError extends RPCError {
    /** @const */
    rpcErrorMessage = '';
    /** @const */
    rpcErrorCode = 'GenericError';
}

/**
 * Requested method is not known.
 * @group Errors
 */
export class RPCNotImplementedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Requested method is not known';
    /** @const */
    rpcErrorCode = 'NotImplemented';
}

/**
 * Requested method is recognised but not supported.
 * @group Errors
 */
export class RPCNotSupportedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Requested method is recognised but not supported';
    /** @const */
    rpcErrorCode = 'NotSupported';
}

/**
 * An internal error occurred and the receiver was not able to process the requested method successfully.
 * @group Errors
 */
export class RPCInternalError extends RPCError {
    /** @const */
    rpcErrorMessage = 'An internal error occurred and the receiver was not able to process the requested method successfully';
    /** @const */
    rpcErrorCode = 'InternalError';
}

/**
 * Payload for method is incomplete.
 * @group Errors
 */
export class RPCProtocolError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for method is incomplete';
    /** @const */
    rpcErrorCode = 'ProtocolError';
}

/**
 * During the processing of method a security issue occurred preventing receiver from completing the method successfully.
 * @group Errors
 */
export class RPCSecurityError extends RPCError {
    /** @const */
    rpcErrorMessage = 'During the processing of method a security issue occurred preventing receiver from completing the method successfully';
    /** @const */
    rpcErrorCode = 'SecurityError';
}

/**
 * Payload for the method is syntactically incorrect or not conform the PDU structure for the method.
 * @group Errors
 */
export class RPCFormatViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically incorrect or not conform the PDU structure for the method';
    /** @const */
    rpcErrorCode = 'FormatViolation';
}

/**
 * @deprecated Same as FormatViolation. Retained for backwards compatibility with OCPP versions 1.6 and below.
 * @group Errors
 */
export const RPCFormationViolationError = RPCFormatViolationError;

/**
 * Payload is syntactically correct but at least one field contains an invalid value.
 * @group Errors
 */
export class RPCPropertyConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload is syntactically correct but at least one field contains an invalid value';
    /** @const */
    rpcErrorCode = 'PropertyConstraintViolation';
}

/**
 * Payload for the method is syntactically correct but at least one of the fields violates occurrence constraints.
 * @group Errors
 */
export class RPCOccurrenceConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates occurrence constraints';
    /** @const */
    rpcErrorCode = 'OccurrenceConstraintViolation';
}

/**
 * @deprecated Same as OccurrenceConstraintViolation. Retained for backwards compatibility with OCPP versions 1.6 and below.
 * @group Errors
 */
export const RPCOccurenceConstraintViolationError = RPCOccurrenceConstraintViolationError;


/**
 * Payload for the method is syntactically correct but at least one of the fields violates data type constraints.
 * @group Errors
 */
export class RPCTypeConstraintViolationError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Payload for the method is syntactically correct but at least one of the fields violates data type constraints';
    /** @const */
    rpcErrorCode = 'TypeConstraintViolation';
}

/**
 * A message with a Message Type Number received is not supported by this implementation.
 * 
 * This error type is no longer sent over the websocket because the OCPP extension fallback mechanism has been
 * updated stating that unknown message types should be ignored instead of resulting in a CALLERROR response.
 * CALLERROR is now exclusively reserved only to be used in replies to problematic CALLs.
 * 
 * Despite this, this error can still manifest as part of a `'badMessage'` event when a message is received
 * with an unknown message type.
 * @group Errors
 */
export class RPCMessageTypeNotSupportedError extends RPCError {
    /** @const */
    rpcErrorMessage = 'A message with a Message Type Number received is not supported by this implementation.';
    /** @const */
    rpcErrorCode = 'MessageTypeNotSupported';
}

/**
 * Content of the call is not a valid RPC Request, for example: MessageId could not be read.
 * @group Errors
 */
export class RPCFrameworkError extends RPCError {
    /** @const */
    rpcErrorMessage = 'Content of the call is not a valid RPC Request, for example: MessageId could not be read.';
    /** @const */
    rpcErrorCode = 'RpcFrameworkError';
}

/**
 * @group Errors
 */
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
